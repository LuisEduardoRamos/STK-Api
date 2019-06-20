'use strict'

let Sequelize = require('sequelize')

const sequelize = new Sequelize("stk4", "SA", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql" 
})

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