const mysql = require("mysql2");
const connection = mysql.createConnection({
    host: "db", // změna z "localhost" na "db"
    user: "root",
    password: "root",
    database: "azt"
});

connection.connect(function(error) {
    if (error) {
        console.error("Error connecting to the database:", error);
        return;
    }
    console.log("DB connected");
});

module.exports = connection;