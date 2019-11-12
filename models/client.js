'use strict'

require('dotenv').config()
let Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mssql" 
  });

let Cliente = sequelize.define('Cliente', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cNombre:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cAlias:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cContacto:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cTelContacto:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cCuenta:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cPassword:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cUsuario:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cApiKey:{
        type: Sequelize.STRING,
        allowNull: false
    }
})

sequelize.sync()

module.exports = Cliente