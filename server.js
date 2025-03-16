require('dotenv').config()

const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

const ErrorHandler = require('./src/middlewares/ErrorHandler')
const UsersRoutes = require('./src/api/users/routes')
const DoctorsRoutes = require('./src/api/doctors/routes')
const BedsRoutes = require('./src/api/beds/routes')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/Users', UsersRoutes)
app.use('/Doctors', DoctorsRoutes)
app.use('/Beds', BedsRoutes)

app.get('*', (_, res) => {
  res.send('Backend Application for PoliQu')
})

app.use(ErrorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})