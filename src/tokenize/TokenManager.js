const jwt = require('jsonwebtoken')

const TokenManager = {
    generateAccessToken: payload => {
        return jwt.sign(payload, process.env.JWTTOKENSECRET, { expiresIn: '15s'})
    },
    generateRefreshToken: payload => {
        return jwt.sign(payload, process.env.JWTREFRESHSECRET)
    }
}

module.exports = TokenManager