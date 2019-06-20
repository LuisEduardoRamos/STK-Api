"use strict";

let Cliente = require("../models/client");
let Sequelize = require("sequelize");

const sequelize = new Sequelize("stk4", "SA", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql"
})

function saveClient(req, res){
    let cliente = new Cliente()
    let params = req.body
    
    cliente.cNombre = params.cNombre
    cliente.cAlias = params.cAlias
    cliente.cContacto = params.cContacto
    cliente.cTelContacto = params.cTelContacto
    cliente.cCuenta = params.cCuenta
    cliente.cPasword = params.cPassword
    cliente.cUsuario = params.cUsuario
    cliente.cApiKey = params.cApiKey
    
    if(cliente.cNombre!=null&&cliente.cAlias!=null&&cliente.cContacto!=null&&
        cliente.cTelContacto!=null&&cliente.cCuenta!=null&&cliente.cPasword!=null&&
        cliente.cUsuario!=null&&cliente.cApiKey!=null){
        
        sequelize.sync().then(()=>{
            Cliente.findOrCreate({
                where:{cUsuario:cliente.cUsuario},
                defaults:{
                    cNombre: cliente.cNombre,
                    cAlias: cliente.cAlias,
                    cContacto: cliente.cContacto,
                    cTelContacto: cliente.cTelContacto,
                    cCuenta: cliente.cCuenta,
                    cPassword: cliente.cPasword,
                    cApiKey: cliente.cApiKey
                }
            }).then(([client, created])=>{
                if(created){
                    res.status(200).send(client)
                }else{
                    res.status(404).send('User in use.')
                }
            })
        })
    }else{
        res.status(403).send({message: 'Introduzca todos los datos.'})
    }
}

function getClientById(req, res){
    let clientId = req.params.id

    if(clientId!=null){
        Cliente.findOne({where:{id:clientId}}).then(client=>{
            if(client){
                res.status(200).send(client)
            }else{
                res.status(404).send({message: 'No se ha encontrado el cliente'})
            }
        })
    }else{
        res.status(403).send({message: 'Introduzca todos los datos.'})
    }
}

function getClients(req, res){
    Cliente.findAll().then(clientes => {
        if(clientes){
            res.status(200).send(clientes)
        }else{
            res.status(500).send({message: 'Usuarios no encontrados'})
        }
    })
}

function editClient(req, res){
    let clientId = req.params.id
    let params = req.body
    Cliente.update(params, {where:{id: clientId}}).then(()=>{
        res.status(200).send({message:'El cliente se ha modificado', status: 200})
    })
}

module.exports = {saveClient, getClientById, getClients, editClient}