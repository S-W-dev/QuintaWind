const mysql = require('mysql');

let settings = {

    mysqlconnection: {
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "pentair"
    }

}

let conn = mysql.createConnection(settings.mysqlconnection);



conn.query("SELECT pentair, password FROM login", (err, rows) => {

    settings.pentair = rows[0].pentair;
    settings.password = rows[0].password;

});

exports.settings = settings;