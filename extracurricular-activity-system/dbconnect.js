const mysql = require("mysql2/promise");
const express = require('express');
const router = express.Router();

var db = {
    host:"localhost",
    user:"NITINJOGI",
    password:"4SF22IS063",
    database:"ECAR",
    waitForConnections:true,
    connectionLimit:10,
};

 const pool = mysql.createPool(db);

 console.log("Connection pools created");

 module.exports = pool;

// const connect =async() => {
//   try {
//       const connection = await mysql.createConnection(db);
//       console.log("Connected to database");
//       // const r = await connection.query('select * from vehicle')
//       // console.log(r);
      
//       return connection;
//   } catch (error) {
//       console.error('Error connecting   to database:', error);
//       throw error;
//   }
//   }
  
// connect();
// module.exports = connecs