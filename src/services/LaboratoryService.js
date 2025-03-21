const pool = require('mysql2/promise')
const NotFoundError = require('../exceptions/NotFoundError')

class LaboratoryService {
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

        const [records] = await this._pool.query("SELECT no_rawat, tgl_periksa, jam FROM periksa_lab WHERE no_rkm_medis = ? GROUP BY tgl_periksa, jam, no_rawat ORDER BY tgl_periksa DESC, jam DESC LIMIT ? OFFSET ?", [MRId, limit, offset])

        return records
    }

    async getDetailData(appointmentId, date, time) {
        const [rows] = await this._pool.query("SELECT jpl.kd_jenis_prw AS kodePerawatan, jpl.nm_perawatan AS namaPerawatan, tl.pemeriksaan, dpl.nilai AS hasil, tl.satuan FROM detail_periksa_lab dpl JOIN periksa_lab pl ON dpl.no_rawat = pl.no_rawat AND dpl.tgl_periksa = pl.tgl_periksa AND dpl.jam = pl.jam JOIN jns_perawatan_lab jpl ON dpl.kd_jenis_prw = jpl.kd_jenis_prw JOIN template_laboratorium tl ON dpl.id_template = tl.id_template WHERE pl.no_rawat = ? AND pl.tgl_periksa = ? AND pl.jam = ? ORDER BY jpl.kd_jenis_prw", [appointmentId, date, time])

        if (rows.length < 1) {
            throw new NotFoundError("Data tidak ditemukan")
        }

        const groupedResults = rows.reduce((acc, row) => {
            const existing = acc.find(item => item.kodePerawatan === row.kodePerawatan);
            if (existing) {
                existing.detail.push({
                    examination: row.pemeriksaan,
                    result: row.hasil,
                    unit: row.satuan
                });
            } else {
                acc.push({
                    treatmentCode: row.kodePerawatan,
                    treatmentName: row.namaPerawatan,
                    details: [{
                        examination: row.pemeriksaan,
                        result: row.hasil,
                        unit: row.satuan
                    }]
                });
            }
            return acc;
        }, []);

        return groupedResults
    }
}

module.exports = LaboratoryService