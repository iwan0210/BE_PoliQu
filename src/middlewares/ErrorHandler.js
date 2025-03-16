const ClientError = require('../exceptions/ClientError')

const ErrorHandler = (err, _req, res, _next) => {
    const errStatus = err.statusCode || 500
    const errMsg  = (err instanceof ClientError) ? err.message : "Something went wrong"
    res.status(errStatus).json({
        error: true,
        status: errStatus,
        message: errMsg
    })

    if (!(err instanceof ClientError)) {
        console.log(err)
    }
}

module.exports = ErrorHandler