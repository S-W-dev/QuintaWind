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



conn.query("SELECT * FROM settings", (err, rows) => {

    var row = rows[0];

    settings.pentair = row.pentair;
    settings.password = row.password;
    settings.interval = parseInt(row.interval);

    settings.port = parseInt(row.port);

    settings.jets = parseInt(row.jets);
    settings.waterfalls = parseInt(row.waterfalls);

});

exports.settings = settings;