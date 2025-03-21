const pool = require('mysql2/promise')

class DoctorsService {
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

    async getAllDoctorsSchedules() {
        const [doctors] = await this._pool.query("SELECT DISTINCT d.kd_dokter, d.nm_dokter, s.nm_sps FROM dokter d JOIN spesialis s ON d.kd_sps = s.kd_sps JOIN jadwal j ON d.kd_dokter = j.kd_dokter")

        const [schedules] = await this._pool.query("select kd_dokter, hari_kerja, TIME_FORMAT(jam_mulai, '%H:%i') as jam_mulai, TIME_FORMAT(jam_selesai, '%H:%i') as jam_selesai, kuota from jadwal")

        const result = doctors.map(doctor => ({
            id: doctor.kd_dokter,
            name: doctor.nm_dokter,
            specialist: doctor.nm_sps,
            schedule: schedules.filter(s => s.kd_dokter === doctor.kd_dokter)
                .map(s => ({
                    day: s.hari_kerja,
                    startTime: s.jam_mulai,
                    endTime: s.jam_selesai,
                    quota: s.kuota
                }))
        }))
        return result
    }

    async getDoctorsByDate(date) {
        const daysIndonesian = ["AKHAD", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]
        const dayIndex = new Date(date).getDay()
        const dayName = daysIndonesian[dayIndex]

        const [doctors] = await this._pool.query("SELECT DISTINCT d.kd_dokter, d.nm_dokter, s.nm_sps FROM dokter d JOIN spesialis s ON d.kd_sps = s.kd_sps JOIN jadwal j ON d.kd_dokter = j.kd_dokter WHERE j.hari_kerja = ?", [dayName])

        const [schedules] = await this._pool.query("SELECT kd_dokter, kd_poli, hari_kerja, TIME_FORMAT(jam_mulai, '%H:%i') as jam_mulai, TIME_FORMAT(jam_selesai, '%H:%i') as jam_selesai, kuota FROM jadwal WHERE hari_kerja = ?", [dayName])

        const result = doctors.map(doctor => ({
            id: doctor.kd_dokter,
            name: doctor.nm_dokter,
            specialist: doctor.nm_sps,
            schedule: schedules.filter(s => s.kd_dokter === doctor.kd_dokter)
                .map(s => ({
                    id: s.kd_poli,
                    day: s.hari_kerja,
                    startTime: s.jam_mulai,
                    endTime: s.jam_selesai,
                    quota: s.kuota
                }))
        }))
        return result
    }
}

module.exports = DoctorsService