const mysql = require("mysql2");
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

connection.connect(function(error) {
    if (error) {
        console.error("Error connecting to the database:", error);
        return;
    }
    console.log("DB connected");
});

module.exports = connection;