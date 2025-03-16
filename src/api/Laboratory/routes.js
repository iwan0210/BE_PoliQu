const router = require('express').Router()
const { verifyToken } = require('../../middlewares/AuthHandler')
const LaboratoryService = require('../../services/LaboratoryService')
const LabValidator = require('../../validator/LaboratoryValidator')
const LaboratoryHandler = require('./controller')

const laboratoryService = new LaboratoryService()
const laboratoryHandler = new LaboratoryHandler(laboratoryService, LabValidator)

router.get('/', verifyToken, laboratoryHandler.getAllData)
router.get('/:patientVisitId/:examDate/:examTime', verifyToken, laboratoryHandler.getDetailData)

module.exports = router