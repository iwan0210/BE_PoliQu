class AppointmentHandler {
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
            this._validator.AppointmentDetailPayloadSchema({ patientVisitId })

            const result = await this._service.getDetailData(patientVisitId)

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

    async getDetailActiveData(req, res, next) {
        try {
            const patientVisitId = decodeURIComponent(req.params.patientVisitId)
            this._validator.AppointmentDetailPayloadSchema({ patientVisitId })

            const result = await this._service.getDetailActiveData(patientVisitId)

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

    async addData(req, res, next) {
        try {
            const data = req.body
            this._validator.AddAppointmentPayloadSchema(data)

            const result = await this._service.addData(
                data.time,
                data.doctorId,
                req.MRId,
                data.polyclinicId,
                data.date
            )

            const response = {
                error: false,
                status: 201,
                message: "success",
                data: result
            }
            res.status(201).json(response)
        } catch (error) {
            next(error)
        }
    }

    async cancelAppointment(req, res, next) {
        try {
            const patientVisitId = decodeURIComponent(req.params.patientVisitId)
            this._validator.AppointmentDetailPayloadSchema({ patientVisitId })

            this._service.cancelAppointment(patientVisitId)

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
}

module.exports = AppointmentHandler