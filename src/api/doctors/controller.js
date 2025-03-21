class DoctorsHandler {
    constructor(service) {
        this._service = service

        this.getAllDoctorsSchedules = this.getAllDoctorsSchedules.bind(this)
        this.getDoctorsByDate = this.getDoctorsByDate.bind(this)
    }

    async getAllDoctorsSchedules(_, res, next) {
        try {
            const schedules = await this._service.getAllDoctorsSchedules()

            const response = {
                error: false,
                status: 200,
                message: "success",
                data: schedules
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }

    async getDoctorsByDate(req, res, next) {
        try {
            const schedules = await this._service.getDoctorsByDate(req.params.date)

            const response = {
                error: false,
                status: 200,
                message: "success",
                data: schedules
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = DoctorsHandler