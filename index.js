"use strict";

var app = require("./app");
var port = 8000 //process.env.PORT || 4500;
const Sequelize = require("sequelize");

// Option 1: Passing parameters separately
const sequelize = new Sequelize("stk4", "sa", "LuisEduardo1997", {
  host: "localhost",
  dialect: "mssql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
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

