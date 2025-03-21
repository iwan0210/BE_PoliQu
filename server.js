require('dotenv').config()

const express = require('express')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const app = express()
const PORT = process.env.PORT || 3000

const ErrorHandler = require('./src/middlewares/ErrorHandler')
const UsersRoutes = require('./src/api/users/routes')
const DoctorsRoutes = require('./src/api/doctors/routes')
const BedsRoutes = require('./src/api/beds/routes')
const LaboratoryRoutes = require('./src/api/Laboratory/routes')
const RadiologyRoutes = require('./src/api/radiology/routes')
const AppointmentRoutes = require('./src/api/appointment/routes')
const RegisterRoutes = require('./src/api/register/routes')

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth()
})

client.on('qr', qr => {
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('WhatsApp Client is READY')
})

// Handle client disconnection
client.on('disconnected', reason => {
  console.log('Client was logged out:', reason)
})

client.initialize()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/Users', UsersRoutes)
app.use('/Doctors', DoctorsRoutes)
app.use('/Beds', BedsRoutes)
app.use('/Laboratory', LaboratoryRoutes)
app.use('/Radiology', RadiologyRoutes)
app.use('/Appointment', AppointmentRoutes)
app.use('/Register', RegisterRoutes)


app.get('*', (_, res) => {
  res.send('Backend Application for PoliQu')
})

app.use(ErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = client