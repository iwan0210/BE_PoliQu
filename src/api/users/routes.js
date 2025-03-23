const router = require('express').Router()
const jwt = require('jsonwebtoken')
const UsersService = require('../../services/UsersServices')
const UserValidator = require('../../validator/UsersValidator')
const UsersHandler = require('./controller')
const TokenManager = require('../../tokenize/TokenManager')
const { verifyToken } = require('../../middlewares/AuthHandler')

const usersService = new UsersService()
const usersHandler = new UsersHandler(usersService, UserValidator, TokenManager, jwt)

router.get('/', verifyToken, usersHandler.getUserProfile)

router.post('/Auth', usersHandler.login)

router.post('/Auth/Refresh', usersHandler.refreshToken)

router.post('/Auth/Password', verifyToken, usersHandler.changePassword)

router.post('/Auth/Logout', verifyToken, usersHandler.logout)

module.exports = router