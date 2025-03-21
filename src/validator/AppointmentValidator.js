const Joi = require('joi')
const InvariantError = require('../exceptions/InvariantError')

const AppointmentSchema = {
    AppointmentPayloadSchema: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(5)
    }),
    AppointmentDetailPayloadSchema: Joi.object({
        appointmentId: Joi.string()
            .pattern(/^\d{4}\/\d{2}\/\d{2}\/\d{6}$/)
            .required()
    }),
    AddAppointmentPayloadSchema: Joi.object({
        date: Joi.date().required(),
        time: Joi.string().required(),
        doctorId: Joi.string().required(),
        polyclinicId: Joi.string().required(),
    })
}

const AppointmentValidator = {
    validateAppointmentPayload: (payload) => {
        const validationResult = AppointmentSchema.AppointmentPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateAppointmentDetailPayload: (payload) => {
        const validationResult = AppointmentSchema.AppointmentDetailPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateAddAppointmentPayload: (payload) => {
        const validationResult = AppointmentSchema.AddAppointmentPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    }
}

module.exports = AppointmentValidator