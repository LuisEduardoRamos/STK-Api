"use strict";
require('dotenv').config()
var app = require("./app");
var port = process.env.PORT
const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "mssql" 
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection to DB has been established successfully.");
    app.listen(port, function() {
      console.log("app running on port: " + port);
    });
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

