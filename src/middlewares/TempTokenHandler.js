const AuthenticationError = require('../exceptions/AuthenticationError')
const ClientError = require('../exceptions/ClientError')
const CryptoJS = require('crypto-js')

const verifyTempToken = (req, _, next) => {
    try {
        const tempToken = req.headers.token

        if (!tempToken) {
            throw new AuthenticationError("Unauthenticated")
        }

        const decoded = decodeTempToken(tempToken)

        if (!decoded.medicalRecordId) {
            throw new ClientError("Invalid Token")
        }

        req.medicalRecordId = decoded.medicalRecordId
        next()
    } catch (error) {
        next(error)
    }
}

const decodeTempToken = (tempToken) => {
    const key = CryptoJS.enc.Utf8.parse(process.env.SECRET);

    const decrypted = CryptoJS.AES.decrypt({
        ciphertext: CryptoJS.enc.Hex.parse(tempToken)
    }, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding })

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)

    return JSON.parse(decryptedText); // Convert JSON string back to object
}

module.exports = { verifyTempToken }