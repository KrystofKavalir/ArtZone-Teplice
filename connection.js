const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "localhost",
    database: "azt",
    user: "root",
    password: ""
});

connection.connect(function(error) {
    if (error) {
        console.error("Error connecting to the database:", error);
        return;
    }
    console.log("DB connected");
});

module.exports = connection;