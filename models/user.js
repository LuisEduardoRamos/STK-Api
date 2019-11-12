'use strict'

require('dotenv').config()
let Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mssql" 
  });

let Usuario = sequelize.define('Usuario', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cEmail:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cNombre:{
        type: Sequelize.STRING,
        allowNull: false
    },
    cPassword:{
        type: Sequelize.STRING,
        allowNull: false
    }
})

sequelize.sync()

module.exports = Usuario