const Joi = require('joi')
const InvariantError = require('../exceptions/InvariantError')

const UserSchema = {
    loginPayloadSchema: Joi.object({
        username: Joi.string().pattern(/^\d{6}$|^\d{16}$/).required(),
        password: Joi.string().required(),
    }),
    refreshTokenPayloadSchema: Joi.object({
        refreshToken: Joi.string().required(),
    }),
    changePasswordPayloadSchema: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })
}

const UserValidator = {
    validateLoginPayload: (payload) => {
        const validationResult = UserSchema.loginPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateRefreshTokenPayload: (payload) => {
        const validationResult = UserSchema.refreshTokenPayloadSchema.validate(payload)
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    },
    validateChangePasswordPayload: payload => {
        const validationResult = UserSchema.changePasswordPayloadSchema.validate(payload)

        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message)
        }
    }
}

module.exports = UserValidator