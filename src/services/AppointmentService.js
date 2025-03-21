const pool = require('mysql2/promise')
const NotFoundError = require('../exceptions/NotFoundError')

class AppointmentService {
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

    async getAllData(MRId, page, limit) {
        const offset = (page - 1) * limit

        const [records] = await this._pool.query("SELECT rp.no_rawat AS appointment_id, rp.tgl_registrasi AS registration_date, rp.jam_reg AS registration_time, d.nm_dokter AS doctor_name, p.nm_poli AS polyclinic_name, rp.stts AS status FROM reg_periksa rp JOIN dokter d ON rp.kd_dokter = d.kd_dokter JOIN poliklinik p ON rp.kd_poli = p.kd_poli WHERE rp.no_rkm_medis = ? AND rp.status_lanjut = 'Ralan' GROUP BY rp.no_rawat ORDER BY rp.tgl_registrasi DESC, rp.jam_reg DESC LIMIT ? OFFSET ?", [MRId, limit, offset])

        return records
    }

    async getDetailData(appointmentId) {
        const [patient] = await this._pool.query("SELECT rp.no_rawat AS appointment_id, rp.no_rkm_medis AS mr_id, d.nm_dokter AS doctor_name, p.nm_poli AS polyclinic_name, rp.tgl_registrasi AS registration_date FROM reg_periksa rp JOIN dokter d ON rp.kd_dokter = d.kd_dokter JOIN poliklinik p ON rp.kd_poli = p.kd_poli WHERE rp.no_rawat = ?", [appointmentId])

        if (patient.length < 1) {
            throw new NotFoundError("Data tidak ditemukan")
        }

        const [diagnoses] = await this._pool.query("SELECT p.nm_penyakit AS disease_name FROM diagnosa d JOIN penyakit p ON d.kd_penyakit = p.kd_penyakit WHERE d.no_rawat = ? AND d.status = 'Ralan'", [appointmentId])

        const [treatments] = await this._pool.query("SELECT jp.nm_perawatan AS treatment_name FROM ( SELECT no_rawat, kd_jenis_prw FROM rawat_jl_dr UNION ALL SELECT no_rawat, kd_jenis_prw FROM rawat_jl_pr UNION ALL SELECT no_rawat, kd_jenis_prw FROM rawat_jl_drpr ) r JOIN jns_perawatan jp ON r.kd_jenis_prw = jp.kd_jenis_prw WHERE r.no_rawat = ?", [appointmentId])

        const [labtests] = await this._pool.query("SELECT jpl.nm_perawatan AS lab_test_name FROM periksa_lab pl JOIN jns_perawatan_lab jpl ON pl.kd_jenis_prw = jpl.kd_jenis_prw WHERE pl.no_rawat = ?", [appointmentId])

        const [radiologyTests] = await this._pool.query("SELECT jpr.nm_perawatan AS radiology_test_name FROM periksa_radiologi pr JOIN jns_perawatan_radiologi jpr ON pr.kd_jenis_prw = jpr.kd_jenis_prw WHERE pr.no_rawat = ?", [appointmentId])

        const [medications] = await this._pool.query("SELECT db.nama_brng AS medicine_name FROM detail_pemberian_obat dpo JOIN databarang db ON dpo.kode_brng = db.kode_brng WHERE dpo.no_rawat = ?", [appointmentId])

        return {
            visit_number: patient[0].appointment_id,
            medical_record_number: patient[0].mr_id,
            doctor_name: patient[0].doctor_name,
            polyclinic_name: patient[0].polyclinic_name,
            registration_date: patient[0].registration_date,
            diagnoses: diagnoses.map(d => d.disease_name),
            treatments: treatments.map(t => t.treatment_name),
            lab_tests: labtests.map(l => l.lab_test_name),
            radiology_tests: radiologyTests.map(r => r.radiology_test_name),
            medications: medications.map(m => m.medicine_name)
        }
    }

    async getDetailActiveData(appointmentId) {
        const [patient] = await this._pool.query("SELECT rp.no_rawat AS visit_number, rp.no_reg AS registration_number, rp.tgl_registrasi AS registration_date, rp.kd_dokter AS doctor_id, rp.kd_poli AS polyclinic_id, d.nm_dokter AS doctor_name, p.nm_poli AS polyclinic_name, rp.stts AS status, WEEKDAY(rp.tgl_registrasi) AS registration_day FROM reg_periksa rp JOIN dokter d ON rp.kd_dokter = d.kd_dokter JOIN poliklinik p ON rp.kd_poli = p.kd_poli WHERE rp.no_rkm_medis = ? AND rp.status_lanjut = 'Ralan' ORDER BY rp.tgl_registrasi DESC LIMIT 1", [appointmentId])

        if (patient.length < 1) {
            throw new NotFoundError("Data tidak ditemukan")
        }

        const daysIndonesian = ["AKHAD", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
        const visit = patient[0];
        const registrationDayIndonesian = daysIndonesian[visit.registration_day]

        const [schedule] = await this._pool.query("SELECT jam_mulai FROM jadwal WHERE kd_dokter = ? AND kd_poli = ? AND hari_kerja = ? LIMIT 1", [visit.doctor_id, visit.polyclinic_id, registrationDayIndonesian])

        const polyclinicStartTime = schedule[0].jam_mulai

        const [servedPatients] = await this._pool.query("SELECT COUNT(*) AS served_count FROM reg_periksa WHERE kd_dokter = ? AND kd_poli = ? AND tgl_registrasi = ? AND stts != 'Belum'", [visit.doctor_id, visit.polyclinic_id, visit.registration_date])

        const servedCount = servedPatients[0].served_count

        const estimatedMinutes = visit.registration_number * 6;
        const [hours, minutes] = polyclinicStartTime.split(':').map(Number);
        const estimatedTime = new Date();
        estimatedTime.setHours(hours, minutes + estimatedMinutes);

        const estimated_time = estimatedTime.toTimeString().slice(0, 5);

        return {
            appointmentId: visit.visit_number,
            doctor_name: visit.doctor_name,
            polyclinic_name: visit.polyclinic_name,
            registration_date: visit.registration_date,
            registration_number: visit.registration_number,
            served_patients: servedCount,
            estimated_time: estimated_time,
            status: visit.status
        };
    }

    async addAppointment(time, doctorId, MRId, polyclinicId, registration_date) {

        await this.checkRegistration(MRId, doctorId, polyclinicId, registration_date)

        await this.checkDoctorSchedule(doctorId, polyclinicId, registration_date)

        const patient = await this.getPasien(MRId)

        const registrationNumber = await this.setRegistrationNumber(polyclinicId, doctorId, registration_date)

        const appointmentStatus = await this.setAppointmentStatus(MRId)
        const registrationCost = await this.setRegistrationCost(polyclinicId, appointmentStatus)

        const polyclinicStatus = await this.setPolyclinicStatus(MRId, polyclinicId, doctorId)

        const [age, ageStatus] = this.getAge(registration_date, patient.tgl_lahir)

        const appointmentId = await this.setAppointmentId(registration_date)

        const alamat = `${patient.alamat}, ${patient.nm_kel}, ${patient.nm_kec}, ${patient.nm_kab}`

        await this.saveRegistration(registrationNumber, appointmentId, registration_date, time, doctorId, MRId, polyclinicId, patient.nm_pasien, alamat, patient.nm_kk, registrationCost, appointmentStatus, age, ageStatus, polyclinicStatus)

        return appointmentId
    }

    async cancelAppointment(appointmentId) {
        const [result] = await this._pool.query("UPDATE reg_periksa SET stts = 'Batal', biaya_reg = 0 WHERE no_rawat = ?", [appointmentId])

        if (result.affectedRows < 1) {
            throw new NotFoundError("Data tidak ditemukan")
        }
    }

    async getPasien(MRId) {
        const [result] = await this._pool.query("SELECT * FROM pasien JOIN kelurahan ON pasien.kd_kel = kelurahan.kd_kel JOIN kecamatan ON pasien.kd_kec = kecamatan.kd_kec JOIN kabupaten ON pasien.kd_kab = kabupaten.kd_kab WHERE no_rkm_medis = ?", [MRId])

        if (result.length < 1) {
            throw new NotFoundError("Data pasien tidak ditemukan")
        }
        return result[0]
    }

    async checkRegistration(MRId, doctorId, polyclinicId, registration_date) {
        const [result] = await this._pool.query("SELECT COUNT(no_rkm_medis) AS countReg FROM reg_periksa WHERE no_rkm_medis = ? AND kd_dokter = ? AND kd_poli = ? AND tgl_registrasi = ? AND stts != 'Batal'", [MRId, doctorId, polyclinicId, registration_date])

        if (result[0].countReg > 0) {
            throw new InvariantError("Pasien sudah terdaftar")
        }
    }

    async saveRegistration(registrationNumber, appointmentId, registration_date, time, doctorId, MRId, polyclinicId, familyName, alamat, family, registrationCost, appointmentStatus, age, ageStatus, polyclinicStatus) {
        await this._pool.query("INSERT INTO reg_periksa VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [registrationNumber, appointmentId, registration_date, time, doctorId, MRId, polyclinicId, familyName, alamat, family, registrationCost, 'Belum', appointmentStatus, 'Ralan', 'A09', age, ageStatus, 'Belum Bayar', polyclinicStatus])
    }

    getAge(registration_date, birth_date) {
        const birthDate = new Date(birth_date)
        const registrationDate = new Date(registration_date)
        const diff = new Date(registrationDate.getTime() - birthDate.getTime())
        let age = diff.getFullYear() - 1970
        let ageStatus = 'Th'
        if (diff.getFullYear() - 1970 === 0) {
            age = diff.getMonth()
            ageStatus = 'Bl'
            if (!diff.getMonth()) {
                age = diff.getDate() - 1
                ageStatus = 'Hr'
            }
        }

        return [age, ageStatus]
    }

    async setRegistrationNumber(polyclinic_id, doctor_id, registration_date) {
        const [result] = await this._pool.query("SELECT ifnull(MAX(CONVERT(RIGHT(no_reg,3),signed)),0) AS no_reg FROM reg_periksa WHERE kd_poli = ? AND kd_dokter = ? AND tgl_registrasi = ? ORDER BY no_reg DESC LIMIT 1", [polyclinic_id, doctor_id, registration_date])

        return (result.length === 0) ? "001" : String(parseInt(result[0].no_reg) + 1).padStart(3, '0')
    }

    async setAppointmentId(registration_date) {
        const [result] = await this._pool.query("SELECT ifnull(MAX(CONVERT(RIGHT(no_rawat,6),signed)),0) as noRawat FROM reg_periksa WHERE tgl_registrasi = ?", [registration_date])

        const noRawat = (result.length === 0) ? "000001" : String(parseInt(result[0].noRawat) + 1).padStart(6, '0')

        return `${registration_date.replace(/-/g, '')}${noRawat}`
    }

    async setAppointmentStatus(MRId) {
        const [result] = await this._pool.query("SELECT COUNT(no_rkm_medis) AS countReg FROM reg_periksa WHERE no_rkm_medis = ? AND stts != 'Batal'", [MRId])

        return (result[0].countReg > 0) ? "Lama" : "Baru"
    }

    async setRegistrationCost(polyclinic_id, AppointmentStatus) {
        const [result] = await this._pool.query("SELECT registrasi, registrasilama FROM poliklinik WHERE kd_poli = ?", [polyclinic_id])

        return (AppointmentStatus === "Lama") ? result[0].registrasilama : result[0].registrasi
    }

    async setPolyclinicStatus(MRId, polyclinic_id, doctor_id) {
        const [result] = await this._pool.query("SELECT COUNT(no_rkm_medis) AS sttsPoli FROM reg_periksa WHERE no_rkm_medis = ? AND kd_poli = ? AND kd_dokter = ? AND stts != 'Batal'", [MRId, polyclinic_id, doctor_id])

        return (result[0].sttsPoli > 0) ? "Lama" : "Baru"
    }

    async checkDoctorSchedule(doctor_id, polyclinic_id, registration_date) {
        const daysIndonesian = ["AKHAD", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
        const registrationDay = daysIndonesian[new Date(registration_date).getDay()]
        const [result] = await this._pool.query("SELECT COUNT(kd_dokter) AS countSchedule FROM jadwal WHERE kd_dokter = ? AND kd_poli = ? AND hari_kerja = ?", [doctor_id, polyclinic_id, registrationDay])

        if (result[0].countSchedule < 1) {
            throw new NotFoundError("Jadwal tidak ditemukan")
        }
    }
}

module.exports = AppointmentService