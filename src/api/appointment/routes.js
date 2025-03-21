const router = require('express').Router()
const { verifyToken } = require('../../middlewares/AuthHandler')
const AppointmentService = require('../../services/AppointmentService')
const AppointmentValidator = require('../../validator/AppointmentValidator')
const AppointmentHandler = require('./controller')

const appointmentService = new AppointmentService()
const appointmentHandler = new AppointmentHandler(appointmentService, AppointmentValidator)

router.get('/', verifyToken, appointmentHandler.getAllData)
router.post('/', verifyToken, appointmentHandler.createData)
router.get('/:patientVisitId', verifyToken, appointmentHandler.getDetailData)
router.put('/:patientVisitId', verifyToken, appointmentHandler.cancelAppointment)
router.get('/active/:patientVisitId', verifyToken, appointmentHandler.getDetailActiveData)

module.exports = router