'use strict'

let express = require('express')
let VehicleController = require('../controllers/vehiculo')

let api = express.Router()

api.post('/save-vehicle/:id', VehicleController.saveVehicle)
api.get('/save-vehicle2', VehicleController.saveVehicle2)
api.get('/find-vehicle/:id', VehicleController.findVehicle)
api.get('/compare-config/:id', VehicleController.comprobarConfiguracion)


module.exports = api