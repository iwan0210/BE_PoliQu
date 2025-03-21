const router = require('express').Router()
const { verifyToken } = require('../../middlewares/AuthHandler')
const RadiologyService = require('../../services/RadiologyService')
const LabValidator = require('../../validator/LaboratoryValidator')
const RadiologyHandler = require('./controller')

const radiologyService = new RadiologyService()
const radiologyHandler = new RadiologyHandler(radiologyService, LabValidator)

router.get('/', verifyToken, radiologyHandler.getAllData)
router.get('/:patientVisitId/:examDate/:examTime', verifyToken, radiologyHandler.getDetailData)

module.exports = router