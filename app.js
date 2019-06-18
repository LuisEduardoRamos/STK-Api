'use strict'

let express = require('express')
let bodyParser = require('body-parser')

var app = express()

let user_routes = require('./routes/user')
let client_routes = require('./routes/client')
let webfleet_routes = require('./routes/webfleet')
let vehicle_routes = require('./routes/vehiculo')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE')
    next()
})

app.use('/api', user_routes)
app.use('/api', client_routes)
app.use('/api', webfleet_routes)
app.use('/api', vehicle_routes)

module.exports = app;
