'use strict'

require('dotenv').config()
let Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mssql" 
  });

let Vehiculo = sequelize.define('Vehiculo', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    webfleetUid:{
        type: Sequelize.STRING,
        allowNull: false
    },
    configurado:{
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
})

sequelize.sync()

module.exports = Vehiculo