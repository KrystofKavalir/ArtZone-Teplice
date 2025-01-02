const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "localhost",
    database: "azt",
    user: "root",
    password: ""
})

connection.connect(function(error) {
    if (error) {
        throw error;
    } else {
        console.log("DB connected");
    }
});
module.exports = connection;