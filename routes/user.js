'use strict'

let express = require('express');
let UserController =  require('../controllers/user');
let md_auth = require('../middleware/authenticated');
let api = express.Router();

api.post('/save-user', md_auth.ensureAuth, UserController.saveUser)
api.post('/login', md_auth.ensureAuth, UserController.login)
api.get('/get-users', md_auth.ensureAuth, UserController.getUsers)
api.post('/recover-password', md_auth.ensureAuth, UserController.recoverPassword)
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser)
api.delete('/delete-user/:id', md_auth.ensureAuth, UserController.deleteUser)

module.exports = api