'use strict'

let express = require('express');
let WebfleetController = require('../controllers/webfleet');
let md_auth = require('../middleware/authenticated');
let api = express.Router()

api.get('/get-vehicles/:id', md_auth.ensureAuth, WebfleetController.getVehicles)
api.post('/get-vehicle-details/:id', md_auth.ensureAuth, WebfleetController.getVehicleDetails)
api.get('/vehicles-filtred/:id', md_auth.ensureAuth, WebfleetController.getVehiclesFiltered)
api.post('/vehicle-by-id/:id', md_auth.ensureAuth, WebfleetController.getVehicleByUid)
api.post('/config-inicial/:id', md_auth.ensureAuth, WebfleetController.configInicial)
api.post('/get-logbook/:id', md_auth.ensureAuth, WebfleetController.logbook)
api.post('/track-vehicle/:id', md_auth.ensureAuth, WebfleetController.trackVehicle)
api.post('/check-standstill/:id', md_auth.ensureAuth, WebfleetController.standStill)
api.get('/sync-messages', md_auth.ensureAuth, WebfleetController.sincronizarBD)
api.post('/comprobar-paro-motor/:id', md_auth.ensureAuth, WebfleetController.probarParoMotor)
api.post('/paro-motor/:id', md_auth.ensureAuth, WebfleetController.paroMotor)
api.post('/entradas-digitales/:id', md_auth.ensureAuth,WebfleetController.entradasDigitales)
api.get('/get-messages/:id', md_auth.ensureAuth, WebfleetController.getMessagesByVehicle)
api.get('/get-vehicles-uber', md_auth.ensureAuth, WebfleetController.getVehiclesUber)
api.get('/get-vehicles-id-uber/:id', md_auth.ensureAuth, WebfleetController.getVehicleByUidUber)
api.get('/entradas-digitales-uber/:id', md_auth.ensureAuth, WebfleetController.entradasDigitalesUber)
api.get('/probar-paro-motor-uber/:id', md_auth.ensureAuth, WebfleetController.probarParoMotorUber)
api.get('/paro-motor-uber', md_auth.ensureAuth, WebfleetController.paroMotorUber)

module.exports = api