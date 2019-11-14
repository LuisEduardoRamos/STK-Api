'use strict'

require('dotenv').config()
let Cliente = require("../models/client")
let Vehiculo = require('../models/vehiculo')
let Message = require('../models/message')
let fetch = require('fetch').fetchUrl
let axios = require('axios')
let moment = require('moment')
let schedule = require('node-schedule')
const Sequelize = require('sequelize');
let inrouteCentral_url = process.env.INROUTE_CENTRAL_URL;

//------------------------------------------------------------------------- Rutina todos los días a las 4:00 A.M.----------------------------------------------------------------------------------------------------//
let rule = new schedule.RecurrenceRule();
rule.hour = 1;
rule.minute = 30;
let automaticDailySyncBD = schedule.scheduleJob(rule, async function () {
    let dormir = false;
    try{
        let { data } = await axios.get(`http://134.209.60.15:8006/api/get-role-credentials-by-service?rol=${1002}&servicio=${2}`);
            if (data.length >= 0) {
                try {
                    let cliente = null;
                    console.log('-------------Mapeo clientes-------------')
                    for(let i =0; i<data.length; i++){
                        cliente = data[i];
                        console.log(`-------------${cliente.cuenta}-------------`)
                        await autoSyncBD(cliente)
                    }
                    // data.map(async cliente => {
                    //     console.log('-------------Mapeo clientes-------------')
                    //     dormir = await autoSyncBD(cliente)
                    //     while (dormir) {
                    //         console.log('-------------------Durmiendo-----------------')
                    //         await sleep(65000)
                    //         dormir = await autoSyncBD(cliente)
                    //     }
                    // })
                    console.log('-------------------Se acabó la sincronización -----------------')
                } catch (error) {
                    console.log({ Error: error })
                }
            } else {
                return 0
            }
    }catch(err){
        console.log('falle');
    }

   
})

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
//--------------------------------------------------Funciones para BD sync mensajes (No tocar, ya funcionan bien )-----------------------------------------------------------------------------------------------------------------------------------------------------//
async function createQueue(credenciales){
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${credenciales.cuenta}&username=${credenciales.usuario}&password=${credenciales.password}&apikey=${credenciales.apikey}&lang=de&action=createQueueExtern&msgclass=0&outputformat=json`;
    try {
        await axios.get(url);
    } catch (err){
        console.log(err);
    }

}
async function popQueue(credenciales) {
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${credenciales.cuenta}&username=${credenciales.usuario}&password=${credenciales.password}&apikey=${credenciales.apikey}&lang=de&action=popQueueMessagesExtern&msgclass=0&outputformat=json&speed=?`
    try {
        let { data } = await axios.get(url);
        if(data.errorCode == 8011){
            return 'dormir'
        }
        else if (data.errorCode) {
            return 'romper';
        } else {
            return data;
        }
    } catch (err) {
        console.log('Regresó falso')
        return 'romper';
    }
}

async function clearQueue(credenciales) {
    let urlAck = `https://csv.business.tomtom.com/extern?lang=en&account=${credenciales.cuenta}&username=${credenciales.usuario}&password=${credenciales.password}&apikey=${credenciales.apikey}&lang=de&action=ackQueueMessagesExtern&msgclass=0&outputformat=json&speed=?`
    try {
        let { data } = await axios.get(urlAck);
        if(data.errorCode == 8011){
            return 'dormir'
        }
        else if (data.errorCode) {
            return false
        } else {
            return true
        }

    } catch (err) {
        console.log('Error clearQueue')
        return false
    }
}

async function autoSyncBD(cliente) {
    console.log('------------------------------Sincronizando BD---------------------------------')
    // var start = new Date().getTime()
    let tiempo = moment().format('DD/MM/YYYY HH:mm:ss')
    let x = moment(tiempo, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
    let antier = x
    let arrayPopQueue = []
    let msgObject = {}
    let statusResp = 200;
    let messageQueue = [];
    let clear = null;
    try {
        let arrayMessages = await popQueue(cliente);
        while(arrayMessages !=='romper'){
            if(arrayMessages === 'dormir' || clear ==='dormir'){
                console.log('dormiré debido a que se me acabo la cuota de pop');
                await sleep(60000);
            }
            else if ( arrayMessages.length > 0 ){
                messageQueue.concat(arrayMessages);
                clear = clearQueue(cliente);
                arrayMessages = popQueue(cliente);
            }
            else{
                break;
            }
        }
        if (messageQueue.length > 0) {
            messageQueue.map(msg => {
                if (msg.msg_type == 70000600 || msg.msg_type == 70000601 || msg.msg_type == 60000545 || msg.msg_type == 60000546) {
                    msgObject = { cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text }
                    Message.create(msgObject).then(messageCreated => {
                        console.log('guarde mensaje');
                    })
                }
            })
        }else{
            console.log('No habia cola de mensajes por guardar');
        }
        // if (arrayMessages) {
        //     let ultimoMsg = arrayMessages.length - 1
        //     let ultimaHora = arrayMessages[ultimoMsg]? arrayMessages[ultimoMsg].msg_time : '';
        //     console.log('Ultimo mensaje');
        //     console.log(arrayMessages[ultimoMsg] );
        //     while (antier.isBefore(ultimaHora)) {
        //         let cont = await clearQueue(cliente);
        //         if(cont==='dormir'){
        //             console.log('dormiré debido a que se me acabo la cuota de ack');
        //             await sleep(60000);
        //             cont = await clearQueue(cliente);
        //         }
        //         else if (!cont) {
        //             console.log('rompi')
        //             statusResp = 405
        //             break
        //         }
        //         arrayPopQueue = await popQueue(cliente);
        //         if(arrayPopQueue === 'dormir'){
        //             console.log('dormiré debido a que se me acabo la cuota de pop');
        //             await sleep(60000);
        //             arrayPopQueue = await popQueue(cliente);
        //         }
        //         console.log("--------Pop queue ---------------");
        //         console.log(arrayPopQueue.length);
        //         if (arrayPopQueue.length != 0) {
        //             ultimoMsg = arrayPopQueue.length - 1
        //             if (arrayPopQueue[ultimoMsg].msg_time != undefined) {
        //                 console.log('Fecha --->' +arrayPopQueue[ultimoMsg].msg_time);
        //                 ultimaHora = moment(arrayPopQueue[ultimoMsg].msg_time)
        //                 arrayMessages = arrayMessages.concat(arrayPopQueue)
        //             }

        //         } else {
        //             console.log('A dormir')
                    
        //         }
        //     }
        //     if (arrayMessages.length > 0) {
        //         arrayMessages.map(msg => {
        //             if (msg.msg_type == 70000600 || msg.msg_type == 70000601 || msg.msg_type == 60000545 || msg.msg_type == 60000546) {
        //                 msgObject = { cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text }
        //                 Message.create(msgObject).then(messageCreated => {
        //                     console.log('guarde mensaje');
        //                 })
        //             }
        //         })
        //         res.status(200).send({ message: 'Inserciones correctas', status: statusResp })
        //     }
        // } else {
        //     res.status(200).send({ message: 'No se han guardado los mensajes' })
        // }
    } catch (error) {
        console.log(error)
    }
    
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

const sincronizarBD = async (req, res) => {
    console.log('------------------------------Sincronizando BD---------------------------------')
    // var start = new Date().getTime()
    let tiempo = moment().format('DD/MM/YYYY HH:mm:ss')
    let x = moment(tiempo, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
    let antier = x
    let arrayPopQueue = []
    let msgObject = {}
    let statusResp = 200;
    let cliente = req.user;
    let messageQueue = [];
    let clear = null;
    try {
        let arrayMessages = await popQueue(cliente);
        while(arrayMessages !=='romper'){
            if(arrayMessages === 'dormir' || clear ==='dormir'){
                console.log('dormiré debido a que se me acabo la cuota de pop');
                await sleep(60000);
            }
            else if ( arrayMessages.length > 0 ){
                messageQueue.concat(arrayMessages);
                clear = clearQueue(cliente);
                arrayMessages = popQueue(cliente);
            }
            else{
                break;
            }
        }
        if (messageQueue.length > 0) {
            messageQueue.map(msg => {
                if (msg.msg_type == 70000600 || msg.msg_type == 70000601 || msg.msg_type == 60000545 || msg.msg_type == 60000546) {
                    msgObject = { cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text }
                    Message.create(msgObject).then(messageCreated => {
                        console.log('guarde mensaje');
                    })
                }
            })
            res.status(200).send({ message: 'Inserciones correctas', status: statusResp })
        }else{
            res.status(200).send({ message: 'Inserciones incorrectas', status: statusResp })
        }
        // if (arrayMessages) {
        //     let ultimoMsg = arrayMessages.length - 1
        //     let ultimaHora = arrayMessages[ultimoMsg]? arrayMessages[ultimoMsg].msg_time : '';
        //     console.log('Ultimo mensaje');
        //     console.log(arrayMessages[ultimoMsg] );
        //     while (antier.isBefore(ultimaHora)) {
        //         let cont = await clearQueue(cliente);
        //         if(cont==='dormir'){
        //             console.log('dormiré debido a que se me acabo la cuota de ack');
        //             await sleep(60000);
        //             cont = await clearQueue(cliente);
        //         }
        //         else if (!cont) {
        //             console.log('rompi')
        //             statusResp = 405
        //             break
        //         }
        //         arrayPopQueue = await popQueue(cliente);
        //         if(arrayPopQueue === 'dormir'){
        //             console.log('dormiré debido a que se me acabo la cuota de pop');
        //             await sleep(60000);
        //             arrayPopQueue = await popQueue(cliente);
        //         }
        //         console.log("--------Pop queue ---------------");
        //         console.log(arrayPopQueue.length);
        //         if (arrayPopQueue.length != 0) {
        //             ultimoMsg = arrayPopQueue.length - 1
        //             if (arrayPopQueue[ultimoMsg].msg_time != undefined) {
        //                 console.log('Fecha --->' +arrayPopQueue[ultimoMsg].msg_time);
        //                 ultimaHora = moment(arrayPopQueue[ultimoMsg].msg_time)
        //                 arrayMessages = arrayMessages.concat(arrayPopQueue)
        //             }

        //         } else {
        //             console.log('A dormir')
                    
        //         }
        //     }
        //     if (arrayMessages.length > 0) {
        //         arrayMessages.map(msg => {
        //             if (msg.msg_type == 70000600 || msg.msg_type == 70000601 || msg.msg_type == 60000545 || msg.msg_type == 60000546) {
        //                 msgObject = { cFecha: msg.msg_time, cUid: msg.objectuid, iTipo: msg.msg_type, cMensaje: msg.msg_text }
        //                 Message.create(msgObject).then(messageCreated => {
        //                     console.log('guarde mensaje');
        //                 })
        //             }
        //         })
        //         res.status(200).send({ message: 'Inserciones correctas', status: statusResp })
        //     }
        // } else {
        //     res.status(200).send({ message: 'No se han guardado los mensajes' })
        // }
    } catch (error) {
        console.log(error)
    }
}

function paroMotor(req, res) {
    let vehcileId = req.body.uid
    let state = req.body.state
    let { cuenta, usuario, password, apikey } = req.user;
    console.log('state', state)
    if (vehcileId != null && clientId != null) {
        Cliente.findOne({ where: { id: clientId } }).then(cliente => {
            if (cliente) {
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&objectuid=${vehcileId}&lang=de&action=switchOutput&status=${state}&outputformat=json&speed=?`
                let { data } = axios.get(url)
                console.log(data)
                res.status(200).send(data)
            } else {
                res.status(200).send({ message: `No se ha encontrado ningún cliente con id: ${clientId}`, status: 404 })
            }
        })
    } else {
        console.log('hola')
        res.status(200).send({ message: 'Introduzca todos los datos', status: 403 })
    }
}

const paroMotorUber = async (req, res) => {
    let { uid, state } = req.query;
    let { cuenta, usuario, password, apikey } = req.user;
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&objectuid=${uid}&lang=de&action=switchOutput&status=${state}&outputformat=json&speed=?`
    let { data } = await axios.get(url)
    console.log(data)
    res.status(200).send(data)
}

function entradasDigitales(req, res) {
    let vehcileId = req.body.uid
    let { cuenta, usuario, password, apikey } = req.user;
    if (vehcileId != null) {
        Message.findAll({
            where: {
                cUid: vehcileId,
                
                iTipo: { [Sequelize.Op.or]: [61100546, 61100545] }
            }
        }).then(mensajes => {
            if (mensajes.length > 0) {
                console.log(mensajes[mensajes.length - 1].dataValues)
                res.status(200).send({ message: mensajes[mensajes.length - 1], status: 200 })
            } else {
                res.status(200).send({ message: 'No hay registros', status: 204 })
            }
        })
    } else {
        res.status(200).send({ message: 'Introduzca todos los datos', status: 403 })
    }
}

function entradasDigitalesUber(req, res) {
    let uid = req.params.id
    console.log(uid);
    Message.findAll({
        where: {
            cUid: uid,
            iTipo: { [Sequelize.Op.or]: [61100546, 61100545] }
        }
    }).then(mensajes => {
        if (mensajes.length > 0) {
            console.log(mensajes[mensajes.length - 1].dataValues)
            res.status(200).send({ message: mensajes[mensajes.length - 1], status: 200 })
        } else {
            res.status(200).send({ message: 'No hay registros', status: 204 })
        }
    })
}

function probarParoMotorUber(req, res) {
    let uid = req.params.id;
    if (uid !== null && uid !== undefined && uid !== '') {
        Message.findAll({ where: { cUid: uid, iTipo: { [Sequelize.Op.or]: [70000600, 70000601] } } }).then(mensajes => {
            if (mensajes.length > 0) {
                console.log(mensajes[mensajes.length - 1].dataValues)
                res.status(200).send(mensajes[mensajes.length - 1])
            } else {
                res.status(200).send({ message: 'No hay registros', status: 204 })
            }
        })
    } else {
        res.status(200).send({ errorCode: 403, message: 'Ingrese el uid  ' })
    }
}

function probarParoMotor(req, res) {
    let vehcileId = req.body.uid
    let clientId = req.params.id

    if (vehcileId != null && clientId != null) {
        Cliente.findOne({ where: { id: clientId } }).then(cliente => {
            if (cliente) {
                Message.findAll({ where: { cUid: vehcileId, iTipo: { [Sequelize.Op.or]: [70000600, 70000601] } } }).then(mensajes => {
                    if (mensajes.length > 0) {
                        console.log(mensajes[mensajes.length - 1].dataValues)
                        res.status(200).send(mensajes[mensajes.length - 1])
                    } else {
                        res.status(200).send({ message: 'No hay registros', status: 204 })
                    }
                })
            } else {
                res.status(200).send({ message: `No se ha encontrado ningún cliente con id: ${clientId}`, status: 404 })
            }
        })
    } else {
        res.status(200).send({ message: 'Introduzca todos los datos', status: 403 })
    }
}

function getVehicleDetails(req, res) {
    let vehicleUid = req.params.id
    let { cuenta, usuario, password, apikey } = req.user;
    if (vehicleUid != null) {
        let options = { method: 'GET' }
        let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&objectuid=${vehicleUid}&lang=de&action=showVehicleReportExtern&outputformat=json&speed=?`
        fetch(url, options, (err, meta, body) => {
            if (err) {
                res.status(500).send({ message: 'Error en la petición a Webfleet.' })
            } else {
                if (body) {
                    res.status(200).send(body)
                } else {
                    res.status(500).send({ message: 'Error en la consulta.' })
                }
            }
        })
    } else {
        res.status(403).send({ message: 'Introduzca el id del vehículo.' })
    }
}

function getVehiclesUber(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showObjectReportExtern&driver=&outputformat=json&speed=?`
    const options = { method: 'GET' };
    fetch(url, options, (err, meta, body) => {
        if (err) {
            res.status(200).send({ errorCode: 404, message: 'Error en la petición a Webfleet.' });
        } else {
            if (body) {
                res.status(200).send(body)
            } else {
                res.status(500).send({ errorCode: 404, message: 'Error en la consulta.' })
            }
        }
    })
}

function getVehicles(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let options = { method: 'GET' }
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showObjectReportExtern&driver=&outputformat=json&speed=?`
    fetch(url, options, (err, meta, body) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición a Webfleet.' })
        } else {
            if (body) {
                res.status(200).send(body)
            } else {
                res.status(500).send({ message: 'Error en la consulta.' })
            }
        }
    })
}

function getVehiclesFiltered(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let options = { method: 'GET' }
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showObjectReportExtern&driver=&outputformat=json&speed=?`
    fetch(url, options, (err, meta, body) => {
        if (err) {
            res.status(500).send({ message: 'Error en la petición a Webfleet.' })
        } else {
            if (body) {
                Vehiculo.findAll().then(vehiculosConfigurados => {
                    if (vehiculosConfigurados) {
                        let response = []
                        let bandera = {}
                        let placas = ""
                        for (let i = 0; i < body.length; i++) {
                            for (let j = 0; j < vehiculosConfigurados.length; j++) {
                                if (body[i].objectuid == vehiculosConfigurados[j]) {
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
                    } else {
                        res.status(200).send(body)
                    }
                })
            } else {
                res.status(500).send({ message: 'Error en la consulta.' })
            }
        }
    })

}

function getVehicleByUidUber(req, res) {
    let id = req.params.id;
    let { cuenta, usuario, password, apikey } = req.user;
    let options = { method: 'GET' }
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showObjectReportExtern&objectuid=${id}&driver=&outputformat=json&speed=?`
    fetch(url, options, (err, meta, body) => {
        if (err) {
            res.status(200).send({ message: 'Error en la petición a Webfleet.' })
        } else {
            if (body) {
                res.status(200).send(body)
            } else {
                res.status(200).send({ message: 'Error en la consulta.' })
            }
        }
    })
}

function getVehicleByUid(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let uid = req.body.uid;
    let options = { method: 'GET' }
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showObjectReportExtern&objectuid=${uid}&driver=&outputformat=json&speed=?`
    fetch(url, options, (err, meta, body) => {
        if (err) {
            res.status(200).send({ message: 'Error en la petición a Webfleet.' })
        } else {
            if (body) {
                res.status(200).send(body)
            } else {
                res.status(200).send({ message: 'Error en la consulta.' })
            }
        }
    })
}

function configInicial(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let params = req.body
    console.log(params.length)
    if (params.speedlimit > 300 || params.speedlimit < 0) {
        res.status(200).send({ message: 'La velocidad leimite tiene que ser mayor que 0 y menor que 300', status: 402 })
    }
    if (params.uid == null || params.uid == undefined) {
        res.status(200).send({ message: 'El uid no puede ir vacío', status: 403 })
    }
    if (params.vehiclecolor == null || params.vehiclecolor == undefined) {
        res.status(200).send({ message: 'El color del vehículo no puede ir vacío', status: 403 })
    }
    if (params.identnumber == null || params.identnumber == undefined) {
        res.status(200).send({ message: 'Introduzca el número de identificación', status: 403 })
    }
    if (params.length == null || params.length == undefined) {
        res.status(200).send({ message: 'El largo del vehículo no puede ir vacío', status: 410 })
    }
    if (params.registrationdate == null || params.registrationdate == undefined) {
        res.status(200).send({ message: 'Ingrese la fecha de registro', status: 403 })
    }
    if (params.licenseplatenumber == null || params.licenseplatenumber == undefined) {
        res.status(200).send({ message: 'Ingrese las plcas del vehículo', status: 403 })
    }
    if (params.netweight == null || params.netweight == undefined) {
        res.status(200).send({ message: 'Ingrese el peso neto', status: 403 })
    }
    if (params.maxweight == null || params.maxweight == undefined) {
        res.status(200).send({ message: 'Ingrese el peso máximo', status: 403 })
    }
    if (params.maxload == null || params.maxload == undefined) {
        res.status(200).send({ message: 'Ingrese la carga máxima', status: 403 })
    }
    if (params.netload == null || params.netload == undefined) {
        res.status(200).send({ message: 'Ingrese la carga total', status: 403 })
    }
    if (params.numaxles == null || params.numaxles == undefined) {
        res.status(200).send({ message: 'Ingrese la cantidad de ejes', status: 403 })
    }
    if (params.width == null || params.width == undefined) {
        res.status(200).send({ message: 'Ingrese la anchura del vehículo', status: 403 })
    }
    if (params.fuelconsumption > 100 || params.fuelconsumption < 0 || params.fuelconsumption == null || params.fuelconsumption == undefined) {
        res.status(200).send({ message: 'El consumo promedio tiene que ser mayor que 0 y menor que 100', status: 403 })
    }
    if (params.fueltype < 0 || params.fueltype > 3 || params.fueltype == null || params.fueltype == undefined) {
        res.status(200).send({ message: 'El tipo de combustible tiene que ser en un rango de 0-3', status: 404 })
    }
    if (params.height == null || params.height == undefined) {
        res.status(200).send({ message: 'Ingrese la altura del vehículo', status: 403 })
    }
    if (params.description == null || params.description == undefined) {
        res.status(200).send({ message: 'Ingrese la descripción del vehículo', status: 403 })
    }
    if (params.power == null || params.power == undefined) {
        res.status(200).send({ message: 'Ingrese la potencia del motor', status: 403 })
    }
    if (params.enginesize == null || params.enginesize == undefined) {
        res.status(200).send({ message: 'Ingrese el tamaño del motor', status: 403 })
    }
    if (params.fuelreference != 0 && params.fuelreference != 1) {
        res.status(200).send({ message: 'El tipo de combustible tiene que ser en un rango de 0-1', status: 401 })
    }
    if (params.vehicletype == null || params.vehicletype == undefined) {
        res.status(200).send({ message: 'Seleccione un tipo de vehículo válido.', status: 405 })
    }
    if (params.fueltanksize == null || params.fueltanksize == undefined) {
        res.status(200).send({ message: 'Ingrese el tamaño del tanque de gasolina', status: 403 })
    }
    if (params.manufacturedyear == null || params.manufacturedyear == undefined) {
        res.status(200).send({ message: 'Ingrese el año de manufactura.', status: 403 })
    }
    if (params.objectname == null || params.objectname == undefined) {
        res.status(200).send({ message: 'Ingrese el nombre del vehículo', status: 403 })
    }

    let options = { method: 'GET' }
    let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=updateVehicle&vehicletype=${params.vehicletype}&vehiclecolor=${params.vehiclecolor}&identnumber=${params.identnumber}&maxweight=${params.maxweight}&registrationdate=${params.registrationdate}&licenseplatenumber=${params.licenseplatenumber}&speedlimit=${params.speedlimit}&fueltype=${params.fueltype}&netweight=${params.netweight}&netload=${params.netload}&maxload=${params.maxload}&numaxles=${params.numaxles}&length=${params.length}&width=${params.width}&height=${params.height}&description=${params.description}&power=${params.power}&enginesize=${params.enginesize}&objectuid=${params.uid}&externalid=${params.externalid}&fueltanksize=${params.fueltanksize}&manufacturedyear=${params.manufacturedyear}&objectname=${params.objectname}&fuelreference=${params.fuelreference}&fuelconsumption=${params.fuelconsumption}&outputformat=json`
    axios.get(url).then(function (response) {
        // handle success
        console.log(response.data)
        if (response.data.length < 1) {
            Vehiculo.create({ webfleetUid: params.uid, configurado: true }).then(vehicleSaved => {
                if (vehicleSaved) {
                    res.status(200).send({ message: 'El vehículo se ha actualizado correctamente', status: 200 })
                } else {
                    res.status(200).send({ message: 'El vehiculo no se ha guardado', status: 406 })
                }
            })
        } else {
            res.status(200).send({ messgae: 'Algo ha salido mal, intente de nuevo', status: 407 })
        }
    })
        .catch(function (error) {
            // handle error
            res.status(200).send({ messgae: 'Algo ha salido mal con la petición', status: 408 })
        })
        .finally(function () {
            // always executed
        });
}

function standStill(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let params = req.body
    if (params.uid == null) {
        res.status(200).send({ message: 'Introduzca el Id', status: 403 })
    } else {
        Cliente.findOne({ where: { id: clientId } }).then(clientFound => {
            if (clientFound) {
                let options = { method: 'GET' }
                let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&objectuid=${params.uid}&action=showStandStills&range_pattern=d-1&outputformat=json&speed=?`
                fetch(url, options, (err, meta, body) => {
                    if (err) {
                        res.status(200).send({ message: 'Error en la petición a Webfleet', status: 500 })
                    } else {
                        if (body) {
                            res.status(200).send(body)
                        } else {
                            res.status(200).send({ message: 'No se han encontrado paradas', status: 404 })
                        }
                    }
                })
            } else {
                res.status(200).send({ message: 'El cliente no se encuentra registrado', status: 403 })
            }
        })
    }
}

function trackVehicle(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let params = req.body
    if (params.uid == null) {
        res.status(200).send({ message: 'Introduzca el uid', status: 403 })
    } else {
        let options = { method: 'GET' }
        let rangeto = moment(params.rangeto, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
        let url = `https://csv.business.tomtom.com/extern?lang=en&account=${cuenta}&username=${usuario}&password=${password}&apikey=${apikey}&lang=de&action=showTracks&rangefrom_string=${rangeto.format('DD/MM/YYYY HH:mm:ss')}&rangeto_string=${params.rangeto}}&outputformat=json&speed=?&objectuid=${params.uid}`
        fetch(url, options, (err, meta, body) => {
            if (err) {
                res.status(200).send({ message: 'Error en la petición a Webfleet', status: 500 })
            } else {
                if (body) {
                    res.status(200).send(body)
                } else {
                    res.status(200).send({ message: 'No se han encontrado tracks', status: 404 })
                }
            }
        })
    }

}
function getMessagesByVehicle(req, res) {
    let uid = req.params.id
    console.log(uid)
    if (uid !== null) {
        Message.findAll({ where: { cUid: uid } }).then(messages => {
            if (messages) {
                res.status(200).send(messages)
            } else {
                res.status(200).send({ message: 'No hay mensajes para mostrar', status: 404 })
            }
        })
    } else {
        res.status(200).send({ message: 'Introduzca el id del vehículo', status: 403 })
    }
}
function logbook(req, res) {
    let { cuenta, usuario, password, apikey } = req.user;
    let params = req.body
    if (params.uid == null) {
        res.status(200).send({ message: 'Introduzca el uid del vehículo.', status: 403 })
    } else {
        let rangeto = moment().format('DD/MM/YYYY HH:mm:ss')
        let rangefrom = moment(rangeto, 'DD/MM/YYYY HH:mm:ss').subtract(48, 'hours')
        let options = { method: 'GET' }
        let url = `https://csv.telematics.tomtom.com/extern?apikey=${apikey}&account=${cuenta}&username=${usuario}&password=${password}&lang=en&outputformat=json&useUTF8=True&action=showLogbook&range_pattern=ud&objectuid=${params.uid}&rangefrom_string=${rangefrom.format('DD/MM/YYYY HH:mm:ss')}&rangeto_string=${rangeto}`
        fetch(url, options, (err, meta, body) => {
            if (err) {
                res.status(200).send({ messgae: 'Se ha producido un error en la petición a Webfleet', status: 500 })
            } else {
                if (body.errorCode) {
                    res.status(200).send({ message: 'Error en la petición', status: 404 })
                } else {
                    res.status(200).send(body)
                }
            }
        })
    }

}
module.exports = {
    getVehicles,
    getVehicleDetails,
    getVehiclesFiltered,
    getVehicleByUid,
    configInicial,
    logbook,
    trackVehicle,
    standStill,
    sincronizarBD,
    probarParoMotor,
    paroMotor,
    entradasDigitales,
    getMessagesByVehicle,
    getVehiclesUber,
    getVehicleByUidUber,
    entradasDigitalesUber,
    probarParoMotorUber,
    paroMotorUber
}