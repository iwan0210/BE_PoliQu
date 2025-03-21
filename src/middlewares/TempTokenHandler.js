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
    const encryptedWordArray = CryptoJS.enc.Hex.parse(tempToken);
    const encryptedBase64 = CryptoJS.enc.Base64.stringify(encryptedWordArray);

    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, process.env.SECRET);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}

module.exports = {verifyTempToken}