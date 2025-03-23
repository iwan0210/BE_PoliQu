const pool = require('mysql2/promise')
const NotFoundError = require('../exceptions/NotFoundError')

class RadiologyService {
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

        const [records] = await this._pool.query("SELECT periksa_radiologi.no_rawat as appointmentId, periksa_radiologi.tgl_periksa as date, periksa_radiologi.jam as time FROM periksa_radiologi JOIN reg_periksa ON periksa_radiologi.no_rawat = reg_periksa.no_rawat WHERE reg_periksa.no_rkm_medis = ? GROUP BY periksa_radiologi.tgl_periksa, periksa_radiologi.jam, periksa_radiologi.no_rawat ORDER BY tgl_periksa DESC, jam DESC LIMIT ? OFFSET ?", [MRId, limit, offset])

        return records
    }

    async getDetailData(appointmentId, date, time) {
        const [rows] = await this._pool.query("SELECT jpr.nm_perawatan AS examination, hr.hasil AS result, gr.lokasi_gambar AS image FROM periksa_radiologi pr JOIN jns_perawatan_radiologi jpr ON pr.kd_jenis_prw = jpr.kd_jenis_prw LEFT JOIN hasil_radiologi hr ON pr.no_rawat = hr.no_rawat AND pr.tgl_periksa = hr.tgl_periksa AND pr.jam = hr.jam LEFT JOIN gambar_radiologi gr ON pr.no_rawat = gr.no_rawat AND pr.tgl_periksa = gr.tgl_periksa AND pr.jam = gr.jam WHERE pr.no_rawat = ? AND pr.tgl_periksa = ? AND pr.jam = ? ORDER BY jpr.nm_perawatan", [appointmentId, date, time])

        if (rows.length < 1) {
            throw new NotFoundError("Data tidak ditemukan")
        }

        const result = {
            examination: [...new Set(rows.map(row => row.examination))],
            result: rows[0].result || "",
            images: rows.map(row => row.image).filter(img => img !== null)
        }

        return result
    }
}

module.exports = RadiologyService