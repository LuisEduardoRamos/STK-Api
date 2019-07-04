"use strict"

let Usuario = require("../models/user");
let Sequelize = require("sequelize");
let nodemailer = require('nodemailer')

const sequelize = new Sequelize("stk4", "sa", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql"
})

function saveUser(req, res){
    let usuario = new Usuario()
    let params = req.body

    usuario.cEmail = params.email,
    usuario.cNombre = params.nombre,
    usuario.cPassword = params.password

    if(usuario.cEmail!=null&&usuario.cNombre!=null&&usuario.cPassword!=null){
        sequelize.sync().then(()=>{
            Usuario.findOrCreate({
                where: {cEmail: usuario.cEmail},
                defaults: {cNombre: usuario.cNombre, cPassword: usuario.cPassword}
            }).then(([user, created]) => {
                if(created){
                    res.status(200).send(user)
                }else{
                    res.status(404).send({message: 'El usuario no se ha creado porque el correo ya pertenece a una cuenta.'})
                }
            })
        })
    }else{
        res.status(403).send({menssage: 'Introduzca todos los datos.'})
    }
}

function login(req, res){
    let params = req.body
    let email = params.email
    let password = params.password
    if(email!=null&&password!=null){
        Usuario.findOne({where: {cEmail: email, cPassword: password}}).then(user=>{
            if(user){
                res.status(200).send(user)
            }else{
                res.status(100).send({message: 'Email or password are incorrect.'})
            }
        })
    }else{
        res.status(202).send({message: 'Introduzca todos los datos.'})
    }
}

function recoverPassword(req, res){
    let mail = req.body.mail
    if(mail!=null){
        Usuario.findOne({where: {cEmail: mail}}).then(user => {
            if(user){
                let transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth:{
                        user: 'inroute.stk@gmail.com',
                        pass: 'Inroute2019'
                    }
                })
                let mailOptions = {
                    from: 'Inroute Support Tool Kit',
                    to: user.cEmail,
                    subject: 'Recuperar contraseña',
                    text: `Se ha solicitado recuperar la contraseña \n Su contraseña es:${user.cPassword}`
                }
                transporter.sendMail(mailOptions, (err, info)=>{
                    if(err){
                        console.log(info)
                        res.status(200).send({message: 'El correo con la recuperación no se ha podido enviar', status: 500})
                    }else{
                        console.log(info)
                        res.status(200).send({message: 'Se le ha enviado un correo con su contraseña.'})
                    }
                })
            }else{
                res.status(200).send({message: 'No se ha encontrado un usuario asociado a ese correo.'})
            }
        })
    }else{
        res.status(200).send({message: 'Introduzca el correo.', status: 403})
    }
}

function getUsers(req, res){
    Usuario.findAll({}).then(usersFound=>{
        if(usersFound){
            res.status(200).send(usersFound)
        }else{
            res.status(200).send({message: 'No se han encontrado agentes', status: 404})
        }
    })
}

function updateUser(req, res){
    let userId = req.params.id
    let params = req.body
    Usuario.update(params, {where:{id:userId}}).then(()=>{
        res.status(200).send({message: 'El usuario se ha actualizado correctamente', status:200})
    })
}

function deleteUser(req, res){
    let userId = req.params.id
    if(userId!==''&&userId!==undefined&&userId!==null){
        Usuario.destroy({where:{
            id: userId
        }}).then(userDeleted=>{
            if(userDeleted){
                res.status(200).send({message:'Agente eliminado', status: 200})
            }else{
                res.status(200).send({message:'El agente no se ha podido eliminar', status: 404})
            }
        })
    }
}

module.exports = {saveUser, login, getUsers, recoverPassword, updateUser, deleteUser}