'use strict'

let Vehiculo = require('../models/vehiculo')
let Sequelize = require("sequelize");
let sql = require('mssql')

const sequelize = new Sequelize("stk4", "sa", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql"
})


function saveVehicle(req, res){
    let uid = req.params.id
    let configurado = req.body.configurado

    if(uid!=null&&configurado!=null){
        Vehiculo.findOne({wehere:{webfleetUid:uid}}).then(vehiculo => {
            if(vehiculo){
                res.status(200).send({message: 'Configurado', status: 1})
            }else{
                Vehiculo.create({webfleetUid:uid, configurado: configurado}).then(vehiculo => {
                    if(vehiculo){
                        res.status(200).send(vehiculo)
                    }else{
                        res.status(200).send({message: 'El vehiculo no se ha configurado'})
                    }
                })
            }
        })
    }else{
        res.stauts(200).send({message: 'Introduzca el id', status: 404})
    }
}

function saveVehicle2(req, res){
    async () => {
        try {
            await sql.connect('mssql://sa:LuisEduardo1997@localhost/stk4')
            const result = await sql.query`insert into Usuarios (cEmail, cNombre, cPassword) values ('luis', 'luis', 'luis')`
            res.status(200).send(result)
        } catch (err) {
            res.status(500).send(err)
        }
    }
}

function findVehicle(req, res){
    let uid = req.params.id
    if(uid){
        Vehiculo.findOne({where:{webfleetUid:uid}}).then(vehiculoEncontrado => {
            if(vehiculoEncontrado){
                res.status(202).send({vehiculoEncontrado})
            }else{
                res.status(200).send({message: 'Config'})
            }
        })
    }
}

function comprobarConfiguracion(req, res){
    let uid = req.params.id
    if(uid){
        Vehiculo.findOne({wehere:{webfleetUid:uid}}).then(vehiculo => {
            if(vehiculo){
                res.status(200).send({message: 'Configurado', status: 1})
            }else{
                res.status(200).send({message: 'No configurado', status: 0})
            }
        })
    }else{
        res.stauts(200).send({message: 'Introduzca el id', status: 404})
    }
}

module.exports = {saveVehicle, saveVehicle2, findVehicle, comprobarConfiguracion}