const router = require('express').Router()
const { verifyTempToken } = require('../../middlewares/TempTokenHandler')
const RegisterService = require('../../services/RegisterService')
const RegisterValidator = require('../../validator/RegisterValidator')
const RegisterHandler = require('./controller')

const registerService = new RegisterService()
const registerHandler = new RegisterHandler(registerService, RegisterValidator)

router.get('/patient', verifyTempToken, registerHandler.getPasientFromTemporaryToken)

router.post('/MedicalRecord', verifyTempToken, registerHandler.postRegisterWithMedicalRecordId)

router.post('/OTP/:medicalRecordId', registerHandler.postCheckOTP)

router.get('/:nationalId', registerHandler.getCheckNationalId)

router.post('/', registerHandler.postRegisterWithoutMedicalRecordId)

module.exports = router