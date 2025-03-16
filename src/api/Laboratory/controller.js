class LaboratoryHandler {
    constructor(service, validator) {
        this._service = service
        this._validator = validator
    }

    async getAllData(req, res, next) {
        try {
            this._validator.validateLabPayload(req.query)

            let { page = 1, limit = 10 } = req.query
            page = parseInt(page)
            limit = parseInt(limit)

            const result = await this._service.getAllData(req.MRId, page, limit)

            const response = {
                error: false,
                status: 200,
                message: "success",
                page: page,
                limit: limit,
                data: result
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async getDetailData(req, res, next) {
        try {
            const patientVisitId = decodeURIComponent(req.params.patientVisitId)
            const examDate = decodeURIComponent(req.params.examDate)
            const examTime = decodeURIComponent(req.params.examTime)

            this._validator.validateLabDetailPayload({ patientVisitId, examDate, examTime })

            const result = await this._service.getDetailData(patientVisitId, examDate, examTime)

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
}

module.exports = LaboratoryHandler