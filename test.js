var mongoose = require("mongoose");

var MONGOconnection = "mongodb://203.197.8.217:27017";
    //options.user=config['mongodb']['user']
    //options.pass=config['mongodb']['password']
    console.log(MONGOconnection);
    var conn = mongoose.createConnection(MONGOconnection);
    conn.on('error', console.error.bind(console, "Database connection error"));
    conn.on('connected', console.error.bind(console, "Mongoose connected"));    
conn.on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
