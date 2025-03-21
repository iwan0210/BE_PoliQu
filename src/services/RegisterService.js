const pool = require('mysql2/promise')
const CryptoJS = require('crypto-js')
const NotFoundError = require('../exceptions/NotFoundError')
const InvariantError = require('../exceptions/InvariantError')
const client = require('../../whatsappClient')

class RegisterService {
    constructor() {
        this._pool = pool.createPool({
            host: process.env.MYSQLHOST,
            user: process.env.MYSQLUSER,
            password: process.env.MYSQLPASS,
            database: process.env.MYSQLDB,
            port: process.env.MYSQLPORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        })
    }

    async checkMedicalRecordId(nationalId) {
        const [result] = await this._pool.query("SELECT no_rkm_medis, no_tlp FROM pasien WHERE no_ktp = ?", [nationalId])

        if (result.length === 0) {
            throw new NotFoundError('Pasien tidak ditemukan')
        }

        await this.checkUserExist(result[0].no_rkm_medis)

        return [result[0].no_rkm_medis, result[0].no_tlp]
    }

    async checkUserExist(medicalRecordId) {
        const [result] = await this._pool.query("SELECT no_rkm_medis FROM poliqu_password WHERE no_rkm_medis = ?", [medicalRecordId])

        if (result.length > 0) {
            throw new InvariantError('User sudah ada')
        }
    }

    async checkOTP(medicalRecordId, otp) {
        const [result] = await this._pool.query("SELECT no_rkm_medis, otp, valid FROM poliqu_otp WHERE no_rkm_medis = ? AND otp = ?", [medicalRecordId, otp])

        if (result.length === 0) {
            throw new NotFoundError('OTP tidak ditemukan')
        }

        if (Date.now() > result[0].valid) {
            throw new InvariantError('OTP sudah kadaluarsa')
        }

        await this._pool.query("DELETE FROM poliqu_otp WHERE no_rkm_medis = ?", [medicalRecordId])
    }

    async generateTemporaryToken(medicalRecordId) {
        const text = JSON.stringify({ medicalRecordId: medicalRecordId, valid: Date.now() + 15 * 60 * 1000 })
        const encrypted = CryptoJS.AES.encrypt(text, process.env.SECRET)
        return encrypted.ciphertext.toString(CryptoJS.enc.Hex)
    }

    async getPatientData(medicalRecordId) {
        const [result] = await this._pool.query("SELECT no_rkm_medis, nm_pasien, no_ktp, tgl_lahir, alamat, jk FROM pasien WHERE no_rkm_medis = ?", [medicalRecordId])

        return {
            medicalRecordId: result[0].no_rkm_medis,
            name: result[0].nm_pasien,
            nationalId: result[0].no_ktp,
            dateOfBirth: result[0].tgl_lahir,
            address: result[0].alamat,
            gender: result[0].jk
        }
    }

    async registerWithMedicalRecordId(medicalRecordId, password) {
        await this._pool.query("INSERT INTO poliqu_password (no_rkm_medis, password) VALUES (?, ?)", [medicalRecordId, password])
    }

    async registerWithoutMedicalRecordId({nationalId, name, gender, dateOfBirth, address, phoneNumber, password}) {
        const [result] = await this._pool.query("SELECT no_rkm_medis FROM pasien WHERE no_ktp = ?", [nationalId])

        if (result.length > 0) {
            throw new InvariantError('User sudah ada')
        }

        const lastMedicalRecordId = await this.getLastMedicalRecordId()
        const newMedicalRecordId = this.generateNewMedicalRecordId(lastMedicalRecordId)

        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear() + " Th"

        const [result2] = await this._pool.query("INSERT INTO pasien VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [newMedicalRecordId, name, nationalId, gender, dateOfBirth, "-", address, "-", "BELUM MENIKAH", new Date().toISOString().split("T")[0], phoneNumber, age, "-", "DIRI SENDIRI", "-", "A09", 1, 1, 1, "-", "ALAMAT", "KELURAHAN", "KECAMATAN", "KABUPATEN", "-", 1, 1, 1, "-", "-", 1, "PROPINSI"]
        )

        if (result2.affectedRows < 1) {
            throw new InvariantError('Gagal mendaftarkan pasien')
        }

        await this._pool.query("INSERT INTO poliqu_password (no_rkm_medis, password) VALUES (?, ?)", [newMedicalRecordId, password])

        await this._pool.query("UPDATE set_no_rkm_medis SET no_rkm_medis = ?", [newMedicalRecordId])

        return newMedicalRecordId
    }

    async getLastMedicalRecordId() {
        const [result] = await this._pool.query("SELECT no_rkm_medis FROM set_no_rkm_medis")

        return result[0].no_rkm_medis
    }

    generateNewMedicalRecordId(lastMedicalRecordId) {
        let left = Number(lastMedicalRecordId.slice(0, 2))
        let middle = Number(lastMedicalRecordId.slice(2, 4))
        let right = Number(lastMedicalRecordId.slice(4, 6))

        left++
        if (left === 100) {
            left = 0
            middle++
        }
        if (middle === 100) {
            middle = 0
            right++
        }
        return `${String(left).padStart(2, "0")}${String(middle).padStart(2, "0")}${String(right).padStart(2, "0")}`
    }

    async createOTP(medicalRecordId) {
        const otp = Math.floor(100000 + Math.random() * 900000)

        const fiveMinutesLater = Date.now() + 5 * 60 * 1000;

        await this._pool.query("INSERT INTO poliqu_otp (no_rkm_medis, otp, valid) VALUES (?, ?, ?)", [medicalRecordId, otp, fiveMinutesLater])

        return otp
    }

    async sendOTPMessages(otp, phoneNumber) {
        const number = this.convertToInternationalFormat("082215207561") + '@c.us'
        const message = `Kode OTP Anda adalah: *${otp}*\nKode ini berlaku selama 5 menit. Jangan berikan kepada siapa pun.\n\nTerima kasih.`
        await client.sendMessage(number, message)
    }

    convertToInternationalFormat(number) {
        if (number.startsWith("0")) {
            return "62" + number.slice(1)
        }
        return number
    }
}

module.exports = RegisterService