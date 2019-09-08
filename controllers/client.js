"use strict";

let Cliente = require("../models/client");
let Sequelize = require("sequelize");

const sequelize = new Sequelize("stk4", "sa", "LuisEduardo1997", {
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
                where:{cAlias:cliente.cAlias},
                defaults:{
                    cNombre: cliente.cNombre,
                    cAlias: cliente.cAlias,
                    cContacto: cliente.cContacto,
                    cTelContacto: cliente.cTelContacto,
                    cUsuario: cliente.cUsuario,
                    cCuenta: cliente.cCuenta,
                    cPassword: cliente.cPasword,
                    cApiKey: cliente.cApiKey
                }
            }).then(([client, created])=>{
                if(created){
                    res.status(200).send(client)
                }else{
                    res.status(404).send({message: 'Alias in use'})
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

function deleteClient(req, res){
    let clientId = req.params.id
    if(clientId!==null&&clientId!==''&&clientId!==undefined){
        Cliente.destroy({where:{
            id: clientId
        }}).then(clienteRemoved=>{
            if(clienteRemoved){
                res.status(200).send({message:'El cliente se ha eliminado.', status:200})
            }else{
                res.stauts(200).send({message:'El cliente no se ha podido eliminar', status: 404})
            }
        })
    }
}

function createDatabase(req, res){
    let db = req.body.db;
    sequelize.query(`CREATE DATABASE ${db}`).then(()=>{
        res.status(200).send({message: 'DB created'});
    })
}

module.exports = {saveClient, getClientById, getClients, editClient, deleteClient, createDatabase}