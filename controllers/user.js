"use strict"

let Usuario = require("../models/user");
let Sequelize = require("sequelize");

const sequelize = new Sequelize("stk4", "SA", "LuisEduardo1997", {
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

function getUsers(req, res){
    Usuario.findAll({}).then(usersFound=>{
        if(usersFound){
            res.status(200).send(usersFound)
        }else{
            res.status(200).send({message: 'No se han encontrado agentes', status: 404})
        }
    })
}

module.exports = {saveUser, login, getUsers}