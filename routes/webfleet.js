'use strict'

let express = require('express')
let WebfleetController = require('../controllers/webfleet')
let api = express.Router()

api.get('/get-vehicles/:id', WebfleetController.getVehicles)
api.post('/get-vehicle-details/:id', WebfleetController.getVehicleDetails)
api.get('/vehicles-filtred/:id', WebfleetController.getVehiclesFiltered)
api.post('/vehicle-by-id/:id', WebfleetController.getVehicleByUid)
api.post('/config-inicial/:id', WebfleetController.configInicial)
api.post('/get-logbook/:id', WebfleetController.logbook)
api.post('/track-vehicle/:id', WebfleetController.trackVehicle)
api.post('/check-standstill/:id', WebfleetController.standStill)
api.post('/sync-messages', WebfleetController.sincronizarBD)
api.post('/comprobar-paro-motor/:id', WebfleetController.probarParoMotor)
api.post('/paro-motor/:id', WebfleetController.paroMotor)
api.post('/entradas-digitales/:id',WebfleetController.entradasDigitales)
api.get('/get-messages/:id', WebfleetController.getMessagesByVehicle)
api.post('/get-vehicles-uber', WebfleetController.getVehiclesUber)
api.post('/get-vehicles-id-uber', WebfleetController.getVehicleByUidUber)
api.get('/entradas-digitales-uber/:id', WebfleetController.entradasDigitalesUber)
api.get('/probar-paro-motor-uber/:id', WebfleetController.probarParoMotorUber)
api.post('/paro-motor-uber/:id', WebfleetController.probarParoMotor)

module.exports = api