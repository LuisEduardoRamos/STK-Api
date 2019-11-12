'use strict'

let express = require('express')
let md_auth = require('../middleware/authenticated');
let VehicleController = require('../controllers/vehiculo');

let api = express.Router()

api.post('/save-vehicle/:id', md_auth.ensureAuth, VehicleController.saveVehicle)
api.get('/save-vehicle2', md_auth.ensureAuth, VehicleController.saveVehicle2)
api.get('/find-vehicle/:id', md_auth.ensureAuth, VehicleController.findVehicle)
api.get('/compare-config/:id', md_auth.ensureAuth, VehicleController.comprobarConfiguracion)


module.exports = api