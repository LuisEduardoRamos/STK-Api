'use strict'

let Cliente = require("../models/client")
let Vehiculo = require('../models/vehiculo')
let Message = require('../models/message')
let fetch = require('fetch').fetchUrl
let axios = require('axios')
let moment = require('moment')
let schedule = require('node-schedule')
const Sequelize = require('sequelize');

//------------------------------------------------------------------------- Rutina todos los días a las 4:00 A.M.----------------------------------------------------------------------------------------------------//
let rule = new schedule.RecurrenceRule()
rule.hour = 4

let automaticDailySyncBD = schedule.scheduleJob(rule, async function(){
    let dormir = false
    let arrayClientes = await Cliente.findAll({where:{cUsuario: 'SUPPORT_APP'}})
    if(arrayClientes.length>=0){
        try {
            arrayClientes.map(async cliente => {
                console.log('-------------Mapeo clientes-------------')
                dormir = await autoSyncBD(cliente.cCuenta)
                while(dormir){
                    await sleep(65000)
                    console.log('-------------------Durmiendo-----------------')
                    dormir = await autoSyncBD(cliente.cCuenta)
                }
            })
            console.log('-------------------Se acabó la sincronización -----------------')
        } catch (error) {
            console.log({Error: error})
        }
    }else{
        return 0
    }
})

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
//--------------------------------------------------Funciones para BD sync mensajes (No tocar, ya funcionan bien )-----------------------------------------------------------------------------------------------------------------------------------------------------//

async function popQueue(cliente){
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=popQueueMessagesExtern&msgclass=0&outputformat=json&speed=?`
    try{
       let {data} = await axios.get(url);
       if(data.errorCode){
           return []
       }else{
          return data; 
       }
    }catch(err){
        console.log('Regresó falso')
        return []
    }
}

async function clearQueue(cliente){
    let urlAck =  `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=ackQueueMessagesExtern&msgclass=0&outputformat=json&speed=?`
    try{
        let {data} = await axios.get(urlAck)
        if(data.errorCode){
           return false 
        }else{
            return true
        }
        
    }catch(err){
        console.log('Error clearQueue')
        return false
    }
}

async function autoSyncBD(clienteCuenta){
    console.log('------------------------Sincronizando-----------------------------')
    let tiempo = moment().format('DD/MM/YYYY HH:mm:ss')
    let x = moment(tiempo, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
    let antier = x
    let arrayPopQueue = []
    let msgObject = {}
    let dormir = false
    if(clienteCuenta){
        try {
            let cliente = await Cliente.findOne({where:{cCuenta: clienteCuenta, cUsuario: 'SUPPORT_APP'}})
            let arrayMessages = await popQueue(cliente)
            console.log('------------------------Primer Pop Queue-----------------------------')
            if(arrayMessages){
                let ultimoMsg = arrayMessages.length - 1
                let ultimaHora = moment(arrayMessages[ultimoMsg].msg_time)
                while(antier.isBefore(ultimaHora)){
                    let cont = await clearQueue(cliente)
                    if(!cont){
                        statusResp = 405
                        break
                    }
                    arrayPopQueue = await popQueue(cliente)
                    if(arrayPopQueue.length!=0){
                        ultimoMsg = arrayPopQueue.length - 1
                        ultimaHora = moment(arrayPopQueue[ultimoMsg].msg_time)
                        arrayMessages = arrayMessages.concat(arrayPopQueue)
                    }else{
                        console.log('----------------A dormir un rato (Se acabaron las peticiones)---------------------')
                        dormir = true 
                    }
                }
                if(arrayMessages.length>0){
                    arrayMessages.map(msg=>{
                        if(msg.msg_type==70000600||msg.msg_type==70000601||msg.msg_type==60000545||msg.msg_type==60000546){
                            msgObject = {cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text}
                            Message.create(msgObject).then(messageCreated =>{
                            })
                        }
                    })
                }
                return dormir
            }
            return dormir
        }catch (error) {
            console.log(error)
        }
    }
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//



const sincronizarBD = async (req, res) =>{
    console.log('------------------------------Sincronizando BD---------------------------------')
    console.log(req.body)
    // var start = new Date().getTime()
    let tiempo = moment().format('DD/MM/YYYY HH:mm:ss')
    let x = moment(tiempo, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
    let antier = x
    let params = req.body
    let arrayPopQueue = []
    let msgObject = {}
    let statusResp = 200
    if(params.cuenta){
        try {
            let cliente = await Cliente.findOne({where:{cCuenta: params.cuenta, cUsuario: 'SUPPORT_APP'}})
            let arrayMessages = await popQueue(cliente)
            if(arrayMessages){
                let ultimoMsg = arrayMessages.length - 1
                let ultimaHora = moment(arrayMessages[ultimoMsg].msg_time)
                while(antier.isBefore(ultimaHora)){
                    let cont = await clearQueue(cliente)
                    if(!cont){
                        statusResp = 405
                        break
                    }
                    arrayPopQueue = await popQueue(cliente)
                    if(arrayPopQueue.length!=0){
                        ultimoMsg = arrayPopQueue.length - 1
                        ultimaHora = moment(arrayPopQueue[ultimoMsg].msg_time)
                        arrayMessages = arrayMessages.concat(arrayPopQueue)
                    }else{
                        break
                    }
                }
                if(arrayMessages.length>0){
                    arrayMessages.map(msg=>{
                        if(msg.msg_type==70000600||msg.msg_type==70000601||msg.msg_type==61100546||msg.msg_type==61100545){
                            msgObject = {cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text}
                            Message.create(msgObject).then(messageCreated =>{
                            })
                        }
                    })
                    res.status(200).send({message: 'Inserciones correctas', status: statusResp})
                }
            }else{
                res.status(200).send({message: 'No se han guardado los mensajes'})
            }
        }catch (error) {
            console.log(error)
        }
    }else{
        res.status(200).send({message: 'Introduzca la cuenta Webfleet', status: 403})
    }
}

function paroMotor(req, res){
    let vehcileId = req.body.uid
    let state = req.body.state
    let clientId = req.params.id
    console.log('state', state)
    if(vehcileId!=null&&clientId!=null){
        Cliente.findOne({where:{id: clientId}}).then(cliente=>{
            if(cliente){
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&objectuid=${vehcileId}&lang=de&action=switchOutput&status=${state}&outputformat=json&speed=?`
                let {data} = axios.get(url)
                console.log(data)
                res.status(200).send(data)
            }else{
                res.status(200).send({message:`No se ha encontrado ningún cliente con id: ${clientId}`, status: 404})  
            }
        })
    }else{
        console.log('hola')
        res.status(200).send({message: 'Introduzca todos los datos', status: 403}) 
    }
}

function entradasDigitales(req, res){
    let vehcileId = req.body.uid
    let clientId = req.params.id

    if(vehcileId!=null&&clientId!=null){
        Cliente.findOne({where:{id:clientId}}).then(cliente => {
            if(cliente){
                Message.findAll({where:{
                    cUid:vehcileId, 
                    iTipo:{[Sequelize.Op.or]: [61100546, 61100545]}
                }}).then(mensajes => {
                    if(mensajes.length>0){
                        console.log(mensajes[mensajes.length-1].dataValues)
                        res.status(200).send({message:mensajes[mensajes.length-1], status: 200})
                    }else{
                        res.status(200).send({message: 'No hay registros', status: 204})
                    }
                })
            }else{
                res.status(200).send({message:`No se ha encontrado ningún cliente con id: ${clientId}`, status: 404})
            }
        })
    }else{
        res.status(200).send({message: 'Introduzca todos los datos', status: 403})
    }
}

function probarParoMotor(req, res){
    let vehcileId = req.body.uid
    let clientId = req.params.id

    if(vehcileId!=null&&clientId!=null){
        Cliente.findOne({where:{id:clientId}}).then(cliente => {
            if(cliente){
                Message.findAll({where:{cUid:vehcileId, iTipo:{[Sequelize.Op.or]: [70000600, 70000601]}}}).then(mensajes => {
                    if(mensajes.length>0){
                        console.log(mensajes[mensajes.length-1].dataValues)
                        res.status(200).send(mensajes[mensajes.length-1])
                    }else{
                        res.status(200).send({message: 'No hay registros', status: 204})
                    }
                })
            }else{
                res.status(200).send({message:`No se ha encontrado ningún cliente con id: ${clientId}`, status: 404})
            }
        })
    }else{
        res.status(200).send({message: 'Introduzca todos los datos', status: 403})
    }
}

function getVehicleDetails(req, res){
    let vehicleUid = req.params.id
    let clientId = req.body.id
    if(vehicleUid!=null&&clientId!=null){
        Cliente.findOne({where: {id:clientId}}).then(cliente => {
            if(cliente){
                let options= {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&objectuid=${vehicleUid}&lang=de&action=showVehicleReportExtern&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(500).send({message: 'Error en la petición a Webfleet.'})
                    }else{
                        if(body){
                            res.status(200).send(body)
                        }else{
                            res.status(500).send({message: 'Error en la consulta.'})
                        }
                    }
                })
            }else{
                res.status(403).send({message: 'No se ha encontrado ningún cliente.'})
            }
        })
    }else{
        res.status(403).send({message: 'Introduzca el id del vehículo.'})
    }
}

function getVehicles(req, res){
    let clientId = req.params.id

    if(clientId!=null){
        Cliente.findOne({where:{id: clientId}}).then(cliente => {
            if(cliente){
                let options= {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=showObjectReportExtern&driver=&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(500).send({message: 'Error en la petición a Webfleet.'})
                    }else{
                        if(body){
                            res.status(200).send(body)
                        }else{
                            res.status(500).send({message: 'Error en la consulta.'})
                        }
                    }
                })
            }else{
                res.status(403).send({message: 'No se ha encontrado ningún cliente.'})
            }
        })
    }else{
        res.status(403).send({message: 'Introduzca todos los datos'})
    }
    
    /*let options = {method:'PUT'}
    fetch('https://incidencias-api.herokuapp.com/api/update-user/5c8ec5a2d3a1aa0004059e37',options, (err, meta, body) => {
    })*/
}

function getVehiclesFiltered(req, res){
    let clientId = req.params.id

    if(clientId!=null){
        Cliente.findOne({where:{id: clientId}}).then(cliente => {
            if(cliente){
                let options= {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=showObjectReportExtern&driver=&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(500).send({message: 'Error en la petición a Webfleet.'})
                    }else{
                        if(body){
                            Vehiculo.findAll().then(vehiculosConfigurados=>{
                                if(vehiculosConfigurados){
                                    let response = []
                                    let bandera = {}
                                    let placas = ""
                                    for (let i = 0; i < body.length; i++) {
                                        for(let j = 0; j < vehiculosConfigurados.length; j++){
                                            if(body[i].objectuid==vehiculosConfigurados[j]){
                                                placas = vehiculosConfigurados[j].cPlacas
                                            }
                                        }
                                        bandera = {
                                            nombre: body[i].objectname,
                                            placas: placas,
                                            uid: body[i].objectuid,
                                            tiempo: body[i].msgtime,
                                            ubicacion: body[i].postext,
                                            status: body[i].ignition
                                        }
                                        response.push(bandera)
                                    }
                                    res.status(200).send(response)
                                }else{
                                    res.status(200).send(body)
                                }
                            })
                        }else{
                            res.status(500).send({message: 'Error en la consulta.'})
                        }
                    }
                })
            }else{
                res.status(403).send({message: 'No se ha encontrado ningún cliente.'})
            }
        })
    }else{
        res.status(403).send({message: 'Introduzca todos los datos'})
    }


}

function getVehicleByUid(req, res){
    let clientId = req.params.id
    let uid = req.body.uid
    if(clientId!=null){
        Cliente.findOne({where:{id: clientId}}).then(cliente => {
            if(cliente){
                let options= {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=showObjectReportExtern&objectuid=${uid}&driver=&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(200).send({message: 'Error en la petición a Webfleet.'})
                    }else{
                        if(body){
                            res.status(200).send(body)
                        }else{
                            res.status(200).send({message: 'Error en la consulta.'})
                        }
                    }
                })
            }else{
                res.status(200).send({message: 'No se ha encontrado ningún cliente.'})
            }
        })
    }else{
        res.status(200).send({message: 'Introduzca todos los datos'})
    }
    
    /*let options = {method:'PUT'}
    fetch('https://incidencias-api.herokuapp.com/api/update-user/5c8ec5a2d3a1aa0004059e37',options, (err, meta, body) => {
    })*/
}

function configInicial(req, res){
    let clienteId = req.params.id
    let params = req.body
    if(params.speedlimit>300||params.speedlimit<0){
        res.status(200).send({message: 'La velocidad leimite tiene que ser mayor que 0 y menor que 300', status: 404})
    }
    if(params.fuelconsumption>100||params.fuelconsumption<0){
        res.status(200).send({message: 'El consumo promedio tiene que ser mayor que 0 y menor que 100', status: 404})
    }
    if(params.fueltype<0||params.fueltype>3){
        res.status(200).send({message: 'El tipo de combustible tiene que ser en un rango de 0-3', status: 404})
    }
    if(params.fuelreference!=0&&params.fuelreference!=1){
        res.status(200).send({message: 'El tipo de combustible tiene que ser en un rango de 0-1', status: 404})   
    }
    
    if(clienteId!=null){
        Cliente.findOne({where:{id:clienteId}}).then(cliente=>{
            if(cliente){
                let options = {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cliente.cCuenta}&username=${cliente.cUsuario}&password=${cliente.cPassword}&apikey=${cliente.cApiKey}&lang=de&action=updateVehicle&vehicletype=${params.vehicletype}&vehiclecolor=${params.vehiclecolor}&identnumber=${params.identnumber}&registrationdate=${params.registrationdate}&licenseplatenumber=${params.licenseplatenumber}&speedlimit=${params.speedlimit}&fueltype=${params.fueltype}&netweight=${params.netweight}&netload=${params.netload}&maxload=${params.maxload}&numaxles=${params.numaxles}&length=${params.length}&width=${params.width}&height=${params.height}&description=${params.description}&power=${params.power}&enginesize=${params.enginesize}&odometer=${params.odometer}&objectuid=${params.uid}&externalid=${params.externalid}&fueltanksize=${params.fueltanksize}&manufacturedyear=${params.manufacturedyear}&fuelreference=${params.fuelreference}&fuelconsumption=${params.fuelconsumption}&outputformat=json`
            
                axios.get(url).then(function (response) {
                    // handle success
                    console.log(response)
                    if(response.data.length<1){
                        Vehiculo.create({webfleetUid:params.uid, configurado: true}).then(vehicleSaved=>{
                            if(vehicleSaved){
                                res.status(200).send({vehicleSaved, status: 200})
                            }else{
                                res.status(200).send({message: 'El vehiculo no se ha guardado', status:404})
                            } 
                        })
                    }else{
                        res.status(200).send({messgae: 'Algo ha salido mal, intente de nuevo', status: 404})
                    }
                })
                .catch(function (error) {
                    // handle error
                    res.status(200).send({messgae: 'Algo ha salido mal con la petición', status: 404})
                })
                .finally(function () {
                    // always executed
                });
            }else{
                res.status(200).send({message: 'El usuario no se ha encotnrado', status: 404})
            }
        })
    }
}

function standStill(req, res){
    let clientId = req.params.id
    let params = req.body
    if(clientId == null || params.uid == null){
        res.status(200).send({message: 'Introduzca el Id', status: 403})
    }else{
        Cliente.findOne({where:{id:clientId}}).then(clientFound=>{
            if(clientFound){
                let options = {method: 'GET'}
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${clientFound.cCuenta}&username=${clientFound.cUsuario}&password=${clientFound.cPassword}&apikey=${clientFound.cApiKey}&lang=de&objectuid=${params.uid}&action=showStandStills&range_pattern=d-1&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(200).send({message: 'Error en la petición a Webfleet', status: 500})
                    }else{
                        if(body){
                            res.status(200).send(body)
                        }else{
                            res.status(200).send({message: 'No se han encontrado paradas', status: 404})
                        }
                    }
                })
            }else{
                res.status(200).send({message: 'El cliente no se encuentra registrado', status: 403})
            }
        })
    }
}

function trackVehicle(req, res){
    let clientId = req.params.id
    let params = req.body
    if(clientId==null){
        res.status(200).send({message: 'Introduzca el id', status: 403})
    }else{
        Cliente.findOne({where:{id:clientId}}).then(clientFound=>{
            if(clientFound){
                let options = {method: 'GET'}
                let rangeto = moment(params.rangeto,'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${clientFound.cCuenta}&username=${clientFound.cUsuario}&password=${clientFound.cPassword}&apikey=${clientFound.cApiKey}&lang=de&action=showTracks&rangefrom_string=${rangeto.format('DD/MM/YYYY HH:mm:ss')}&rangeto_string=${params.rangeto}}&outputformat=json&speed=?&objectuid=${params.uid}`
                fetch(url, options, (err, meta, body)=>{
                    if(err){
                        res.status(200).send({message: 'Error en la petición a Webfleet', status: 500})
                    }else{
                        if(body){
                            res.status(200).send(body)
                        }else{
                            res.status(200).send({message: 'No se han encontrado tracks', status: 404})
                        }
                    }
                })
            }else{
                res.status(200).send({message:'El id no coincide con ningún cliente', status: 404})
            }
        })
    }

}

function logbook(req, res){
    let clientId = req.params.id
    let params = req.body
    if(clientId == null){
        res.status(200).send({message:'Introduzca el id del cliente.', status: 403})
    }else{
        Cliente.findOne({where:{id: clientId}}).then(clientFound =>{
            let rangeto = moment().format('DD/MM/YYYY HH:mm:ss')
            let rangefrom = moment(rangeto,'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')

            let options = {method: 'GET'}
            let url = `https://csv.telematics.tomtom.com/extern?apikey=${clientFound.cApiKey}&account=${clientFound.cCuenta}&username=${clientFound.cUsuario}&password=${clientFound.cPassword}&lang=en&outputformat=json&useUTF8=True&action=showLogbook&range_pattern=ud&objectuid=${params.uid}&rangefrom_string=${rangefrom.format('DD/MM/YYYY HH:mm:ss')}&rangeto_string=${rangeto}`
            fetch(url, options, (err, meta, body)=>{
                if(err){
                    res.status(200).send({messgae:'Se ha producido un error en la petición a Webfleet', status: 500})
                }else{
                    if(body.errorCode){
                        res.status(200).send({message: 'Error en la petición', status: 404})
                    }else{
                        res.status(200).send(body)
                    }
                }
            })
        })
    }
    
}
module.exports = {getVehicles, getVehicleDetails, getVehiclesFiltered, getVehicleByUid, configInicial, logbook, trackVehicle, standStill, sincronizarBD, probarParoMotor, paroMotor, entradasDigitales}