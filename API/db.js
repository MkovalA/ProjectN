const Sequelize = require('sequelize');
const config = require("./config");

const sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD,
  {
    host: "localhost",
    dialect: "mysql"
  }
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
 }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
 });

module.exports = sequelize;
