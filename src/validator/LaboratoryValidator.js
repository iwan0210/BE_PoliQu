const Joi = require('joi')
const InvariantError = require('../exceptions/InvariantError')

const LabSchema = {
    labPayloadSchema: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(5)
    }),
    labDetailPayloadSchema: Joi.object({
        patientVisitId: Joi.string()
            .pattern(/^\d{4}\/\d{2}\/\d{2}\/\d{6}$/)
            .required(),
        examDate: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required(),
        examTime: Joi.string()
            .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
            .required()
    })
}

const LabValidator = {
    validateLabPayload: (payload) => {
        const validationResult = LabSchema.labPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateLabDetailPayload: (payload) => {
        const validationResult = LabSchema.labDetailPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    }
}

module.exports = LabValidator