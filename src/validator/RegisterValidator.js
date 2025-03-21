const Joi = require('joi')
const InvariantError = require('../exceptions/InvariantError')

const RegisterSchema = {
    registerPayloadSchema: Joi.object({
        nationalId: Joi.string().required().length(16),
    }),
    otpPayloadSchema: Joi.object({
        otp: Joi.string().required().length(6),
    }),
    registerWithMedicalRecordIdPayloadSchema: Joi.object({
        password: Joi.string().required(),
    }),
    registerWithoutMedicalRecordIdPayloadSchema: Joi.object({
        nationalId: Joi.string().required().length(16),
        name: Joi.string().required(),
        gender: Joi.string().valid("L", "P").required(),
        dateOfBirth: Joi.date().required(),
        address: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required(),
    })
}

const RegisterValidator = {
    validateRegisterPayload: (payload) => {
        const validationResult = RegisterSchema.registerPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateOTP: (payload) => {
        const validationResult = RegisterSchema.otpPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateRegisterWithMedicalRecordIdPayload: (payload) => {
        const validationResult = RegisterSchema.registerWithMedicalRecordIdPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateRegisterWithoutMedicalRecordIdPayload: (payload) => {
        const validationResult = RegisterSchema.registerWithoutMedicalRecordIdPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    }
}

module.exports = RegisterValidator