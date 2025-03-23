const jwt = require('jsonwebtoken')

const TokenManager = {
    generateAccessToken: payload => {
        const nowUTC = Math.floor(Date.now() / 1000); // Get current time in UTC (seconds)

        return jwt.sign(
            { ...payload, iat: nowUTC },  // Explicitly set issued time
            process.env.JWTTOKENSECRET,
            { expiresIn: '15s' } // Set expiration relative to `iat`
        );
    },
    generateRefreshToken: payload => {
        return jwt.sign(payload, process.env.JWTREFRESHSECRET)
    }
}

module.exports = TokenManager