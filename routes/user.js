'use strict'

let express = require('express');
let UserController =  require('../controllers/user');
let api = express.Router();

api.post('/save-user', UserController.saveUser)
api.post('/login', UserController.login)
api.get('/get-users', UserController.getUsers)
module.exports = api