const pool = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const AuthenticationError = require('../exceptions/AuthenticationError')
const InvariantError = require('../exceptions/InvariantError')
const NotFoundError = require('../exceptions/NotFoundError')


class UsersService {
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

    async verifyCredential(username, password) {
        const result = await this._pool.query("SELECT pasien.no_rkm_medis, pasien.nm_pasien poliqu_password.password FROM pasien JOIN poliqu_password ON pasien.no_rkm_medis = poliqu_password.no_rkm_medis WHERE pasien.no_rkm_medis = ? or pasien.no_ktp = ?", [username, username])

        if (result[0].length < 1) {
            throw new AuthenticationError("Kredensial  yang anda berikan salah")
        }

        const { no_rkm_medis: MRId, nm_pasien: patientName, password: hashedPassword } = result[0][0]

        const match = await bcrypt.compare(password, hashedPassword)

        if (!match) {
            throw new AuthenticationError("Kredensial  yang anda berikan salah")
        }

        return { MRId, patientName }
    }

    async saveRefreshToken(MRId, refreshToken) {
        const result = await this._pool.query("INSERT INTO poliqu_refresh_token VALUES (?, ?)", [MRId, refreshToken])

        if(result[0].affectedRows < 1) {
            throw new InvariantError("Refresh token gagal disimpan")
        }
    }

    async verifyRefreshToken(refreshToken) {
        const result = await this._pool.query("SELECT refresh_token FROM poliqu_refresh_token WHERE refresh_token = ?", [refreshToken])

        if (result[0].length < 1) {
            throw new AuthenticationError("Kredensial  yang anda berikan salah")
        }
    }

    async getUserProfile(MRId) {
        const result = await this._pool.query("SELECT pasien.no_rkm_medis as MRId, pasien.nm_pasien as patientName, pasien.no_ktp as patientId, pasien.tgl_lahir as patientBirth, pasien.alamat as patientAddress, pasien.jk as patientGender FROM pasien where pasien.no_rkm_medis = ?", [MRId])

        if (result[0].length < 1) {
            throw new InvariantError("Pasien tidak ditemukan")
        }

        return result[0][0]
    }

    async changePassword(MRId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const result = await this._pool.query("UPDATE poliqu_password SET password = ? WHERE no_rkm_medis = ?", [hashedPassword, MRId])

        if (result[0].affectedRows < 1) {
            throw new InvariantError("Gagal mengubah password")
        }
    }

    async checkCurrentPassword(MRId, currentPassword) {
        const result = await this._pool.query("select password from poliqu_password where no_rkm_medis = ?", [MRId])

        if (result[0].length < 1) {
            throw new NotFoundError("User tidak ditemukan")
        }

        const match = await bcrypt.compare(currentPassword, result[0][0].password)

        if (!match) {
            throw new AuthenticationError("Password sekarang tidak sesuai")
        }
    }
}

module.exports = UsersService