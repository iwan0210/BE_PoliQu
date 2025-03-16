const router = require('express').Router()
const DoctorsService = require('../../services/DoctorsService')
const DoctorsHandler = require('./controller')
const { verifyToken } = require('../../middlewares/AuthHandler')


const doctorsService = new DoctorsService()
const doctorsHandler = new DoctorsHandler(doctorsService)

router.get('/', verifyToken, doctorsHandler.getAllDoctorsSchedules)

router.get('/:date', verifyToken, doctorsHandler.getDoctorsByDate)

module.exports = router