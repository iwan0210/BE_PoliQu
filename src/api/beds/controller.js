class BedsHandler {
    constructor(service) {
        this._service = service
    }

    async getAllBeds(_, res, next) {
        try {
            const beds = await this._service.getAllBeds()
            const response = {
                error: false,
                status: 200,
                message: "success",
                data: beds
            }
            res.status(200).json(response)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = BedsHandler