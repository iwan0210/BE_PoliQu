const jwt = require('jsonwebtoken')
const AuthenticationError = require('../exceptions/AuthenticationError')
const ClientError = require('../exceptions/ClientError')

const verifyToken = (req, _, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AuthenticationError("Unauthenticated")
        }

        const token = authHeader.split(" ")[1]
        if (!token) {
            throw new AuthenticationError("Unauthenticated")
        }

        const decoded = jwt.verify(token, process.env.JWTTOKENSECRET)

        if (!decoded.medicalRecordId) {
            throw new ClientError("Invalid Token")
        }

        req.medicalRecordId = decoded.medicalRecordId
        req.patientName = decoded.patientName

        next()

    } catch (error) {
        next(error)
    }
}

module.exports = {verifyToken}