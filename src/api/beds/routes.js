const router = require('express').Router()
const BedsServive = require('../../services/BedsService')
const BedsHandler = require('./controller')
const { verifyToken } = require('../../middlewares/AuthHandler')

const bedsService = new BedsServive()
const bedsHandler = new BedsHandler(bedsService)

router.get('/', verifyToken, bedsHandler.getAllBeds)

module.exports = router