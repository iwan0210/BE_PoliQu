const pool = require('mysql2/promise')

class BedsService {
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

    async getAllBeds() {
        const [beds] = await this._pool.query("SELECT b.nm_bangsal AS bedName, COALESCE(SUM(CASE WHEN k.status = 'KOSONG' THEN 1 ELSE 0 END), 0) AS available FROM bangsal b INNER JOIN kamar k ON b.kd_bangsal = k.kd_bangsal WHERE k.statusdata = '1' GROUP BY b.nm_bangsal")
        return beds
    }
}

module.exports = BedsService