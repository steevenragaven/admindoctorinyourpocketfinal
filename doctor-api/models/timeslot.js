// models/timeslot.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('doctor', 'postgres', '12345678', {
  dialect: 'postgres',
  host: 'localhost',
});

const Timeslot = sequelize.define('Timeslot', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  starttime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endtime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  doctorid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // other fields as needed
});

module.exports = Timeslot;
