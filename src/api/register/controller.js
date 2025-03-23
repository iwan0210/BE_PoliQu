class RegisterHandler {
    constructor(service, validator) {
        this._service = service
        this._validator = validator

        this.getCheckNationalId = this.getCheckNationalId.bind(this)
        this.postCheckOTP = this.postCheckOTP.bind(this)
        this.getPasientFromTemporaryToken = this.getPasientFromTemporaryToken.bind(this)
        this.postRegisterWithMedicalRecordId = this.postRegisterWithMedicalRecordId.bind(this)
        this.postRegisterWithoutMedicalRecordId = this.postRegisterWithoutMedicalRecordId.bind(this)
    }

    async getCheckNationalId(req, res, next) {
        try {
            this._validator.validateRegisterPayload(req.params)

            const [medicalRecordId, phoneNumber] = await this._service.checkMedicalRecordId(req.params.nationalId)

            const otp = await this._service.createOTP(medicalRecordId)

            const response = {
                error: false,
                status: 200,
                message: 'success',
                data: {
                    medicalRecordId
                }
            }
            res.status(200).json(response)

            this._service.sendOTPMessages(otp, phoneNumber)
        } catch (error) {
            next(error)
        }
    }

    async postCheckOTP(req, res, next) {
        try {
            this._validator.validateOTP(req.body)

            await this._service.checkOTP(req.params.medicalRecordId, req.body.code)

            const temporaryToken = await this._service.generateTemporaryToken(req.params.medicalRecordId)

            const response = {
                error: false,
                status: 200,
                message: 'success',
                data: {
                    temporaryToken
                }
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async getPasientFromTemporaryToken(req, res, next) {
        try {
            const patient = await this._service.getPatientData(req.medicalRecordId)
            const response = {
                error: false,
                status: 200,
                message: 'success',
                data: {
                    ...patient
                }
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async postRegisterWithMedicalRecordId(req, res, next) {
        try {
            this._validator.validateRegisterWithMedicalRecordIdPayload(req.body)

            await this._service.checkUserExist(req.medicalRecordId)

            await this._service.registerWithMedicalRecordId(req.medicalRecordId, req.body.password)

            const response = {
                error: false,
                status: 200,
                message: 'success'
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async postRegisterWithoutMedicalRecordId(req, res, next) {
        try {
            this._validator.validateRegisterWithoutMedicalRecordIdPayload(req.body)

            await this._service.checkUserExist(req.body.nationalId)

            const medicalRecordId = await this._service.registerWithoutMedicalRecordId(req.body)

            const response = {
                error: false,
                status: 200,
                message: 'success',
                data: {
                    medicalRecordId
                }
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

}

module.exports = RegisterHandler