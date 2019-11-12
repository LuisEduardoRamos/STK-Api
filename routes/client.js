'use strict'

let express = require('express')
let ClienteController = require('../controllers/client');
let md_auth = require('../middleware/authenticated');
let api = express.Router()

api.post('/save-client', md_auth.ensureAuth, ClienteController.saveClient)
api.get('/get-client/:id' , md_auth.ensureAuth, ClienteController.getClientById)
api.get('/get-clients' , md_auth.ensureAuth, ClienteController.getClients)
api.put('/update-client/:id' , md_auth.ensureAuth, ClienteController.editClient)
api.delete('/delete-client/:id' , md_auth.ensureAuth, ClienteController.deleteClient)
api.post('/create-db' , md_auth.ensureAuth, ClienteController.createDatabase)

module.exports = api