class UsersHandler {
    constructor(service, validator, tokenManager, jwt) {
        this._service = service
        this._validator = validator
        this._tokenManager = tokenManager
        this._jwt = jwt

        this.login = this.login.bind(this)
        this.refreshToken = this.refreshToken.bind(this)
        this.getUserProfile = this.getUserProfile.bind(this)
        this.changePassword = this.changePassword.bind(this)
        this.logout = this.logout.bind(this)
    }

    async login(req, res, next) {
        try {
            this._validator.validateLoginPayload(req.body)

            const { username, password } = req.body

            const userCred = await this._service.verifyCredential(username, password)

            const accessToken = this._tokenManager.generateAccessToken(userCred)

            const refreshToken = this._tokenManager.generateRefreshToken(userCred)

            await this._service.saveRefreshToken(refreshToken)

            const response = {
                error: false,
                status: 200,
                message: "success",
                data: {
                    ...userCred,
                    accessToken,
                    refreshToken
                }
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async refreshToken(req, res, next) {
        try {
            this._validator.validateRefreshTokenPayload(req.body)

            const { refreshToken } = req.body

            const decode = this._jwt.verify(refreshToken, process.env.JWTREFRESHSECRET)

            this._service.verifyRefreshToken(refreshToken)

            const newAccessToken = this._tokenManager.generateAccessToken(decode)

            const response = {
                error: false,
                status: 200,
                message: "success",
                data: {
                    accessToken: newAccessToken
                }
            }
            res.status(200).json(response)


        } catch (error) {
            next(error)
        }
    }

    async getUserProfile(req, res, next) {
        try {
            const result = await this._service.getUserProfile(req.medicalRecordId)

            const response = {
                error: false,
                status: 200,
                message: "success",
                data: result
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async changePassword(req, res, next) {
        try {
            this._validator.validateChangePasswordPayload(req.body)

            const { currentPassword, newPassword } = req.body

            await this._service.checkCurrentPassword(req.medicalRecordId, currentPassword)

            await this._service.changePassword(req.medicalRecordId, newPassword)

            const response = {
                error: false,
                status: 200,
                message: "success"
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async logout(req, res, next) {
        try {
            this._validator.validateRefreshTokenPayload(req.body)

            await this._service.deleteRefreshToken(req.body.refreshToken)

            const response = {
                error: false,
                status: 200,
                message: 'success'
            }
            res.status(200).json(response)
        }
        catch (error) {
            next(error)
        }

    }

}

module.exports = UsersHandler