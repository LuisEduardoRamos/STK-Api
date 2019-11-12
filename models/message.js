'use strict'

require('dotenv').config()
let Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mssql" 
  });

let Message = sequelize.define('Message', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cFecha:{
        type:Sequelize.STRING,
        allowNull: false
    },
    cUid:{
        type:Sequelize.STRING,
        allowNull: false
    },
    iTipo:{
        type: Sequelize.INTEGER,
        allowNull: false
    },
    cMensaje:{
        type:Sequelize.STRING,
        allowNull: false
    }
})

sequelize.sync()
module.exports = Message