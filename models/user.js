let Sequelize = require('sequelize')

const sequelize = new Sequelize("stk4", "SA", "LuisEduardo1997", {
    host: "localhost",
    dialect: "mssql" 
})

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