'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
require('dotenv').config()
var secret = process.env.TOKEN_PASS

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message:'La petición no tiene la cabecera de autenticación'})
    }
    
    var token = req.headers.authorization.replace(/['"]+/g, '')

    try {
        var payload = jwt.decode(token, secret)
        if(payload <= moment().unix())
        return res.status(404).send({message:'El token ha expirado'})

    } catch (ex) {
        //console.log(ex)
        return res.status(404).send({message:'Token no válido'})
    }

    req.user = payload;
    next()
}