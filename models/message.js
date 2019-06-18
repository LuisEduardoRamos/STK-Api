'use strict'

let Sequelize = require('sequelize')

const sequelize = new Sequelize("stk4", "sa", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql" 
})

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