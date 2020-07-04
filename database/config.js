var mysql = require('mysql');

// Connection configuration
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your_new_password",
    database: "news_category"
});

// Function to connect with database 
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

module.exports = { connection };