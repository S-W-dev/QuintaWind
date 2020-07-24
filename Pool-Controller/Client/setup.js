const mysql = require('mysql');

let settings = {

    pentair: process.env.pentair||'Pentair: ' + '0F-50-40',
    password: process.env.password||'',
    interval: process.env .interval||1000 * 30 /*30s*/ , /* 1000 * 60 * 1  ==  one minute*/
    port: 3000,

    mysqlconnection: {
        host: "127.0.0.1",
        user: "root",
        password: ""
    },

    mysqlconnection1: {
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "pentair"
    },

    //circuits
    spa: 500,
    jets: 501,
    waterfalls: 502,
    pool: 505,

    default: {
        spa: '101',
        pool: '83',
        waterfalls: 'off',
        jets: 'off',
        lights: 'off',
        cleaner: 'off'
    }
    
}

let conn = mysql.createConnection(settings.mysqlconnection);

let finished;
let exists;
conn.query(`SHOW DATABASES LIKE 'pentair';`, function (err, result) {
    if (err) throw err;
    if (result.length != 1) {
        console.log("Pentair database doesn't exist. Creating it now...");
        conn.query("CREATE DATABASE pentair", function (err, result) {
            if (err) throw err;
            //conn = mysql.createConnection(settings.mysqlconnection);
            conn.query("USE pentair", (err, result) => {});
            conn.query(`CREATE TABLE settings (pentair VARCHAR(255), password VARCHAR(255), \`interval\` VARCHAR(255), port VARCHAR(255), spa VARCHAR(255), jets VARCHAR(255), waterfalls VARCHAR(255), pool VARCHAR(255))`, function (err, result) {
                if (err) throw err;
            });

            conn.query(`CREATE TABLE circuit_history (waterfalls VARCHAR(255), jets VARCHAR(255), cleaner VARCHAR(255), lights VARCHAR(255), pool_setpoint VARCHAR(255), spa_setpoint VARCHAR(255))`, function (err, result) {
                if (err) throw err;
            });

            conn.query(`CREATE TABLE pool_data (timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, version VARCHAR(255), status VARCHAR(255), poolTemp VARCHAR(255), spaTemp VARCHAR(255), airTemp VARCHAR(255), saltPPM VARCHAR(255), pH VARCHAR(255), saturation VARCHAR(255), isSpaActive VARCHAR(255), isPoolActive VARCHAR(255), calcium VARCHAR(255), cyanuricAcid VARCHAR(255), alkalinity VARCHAR(255), saltCellInstalled VARCHAR(255), degC VARCHAR(255))`, function (err, result) {
                if (err) throw err;
            });

        });
        exists = false;
    } else {
            exists = true;
    }

    finished = true;
});

setTimeout(()=>{

    if (finished != undefined && exists == false) {
        conn.end();
        conn = mysql.createConnection(settings.mysqlconnection1);
        conn.connect((err) => {
            conn.query(`INSERT INTO settings (pentair, password, \`interval\`, port, spa, jets, waterfalls, pool) VALUES ('${settings.pentair}', '${settings.password}', '${settings.interval}', '${settings.port}', '${settings.spa}', '${settings.jets}', '${settings.waterfalls}', '${settings.pool}')`, (err, result) => {
                if (err) throw err;
            });

            conn.query(`INSERT INTO circuit_history (waterfalls, jets, cleaner, lights, spa_setpoint, pool_setpoint) VALUES ('${settings.default.waterfalls}', '${settings.default.jets}', '${settings.default.cleaner}', '${settings.default.lights}', '${settings.default.spa}', '${settings.default.pool}')`, (err, result) => {
                if (err) throw err;
            });
            conn.end();
        });
    } else {
        console.log("Data already exists. Resetting db");
        conn.query("drop database pentair;")
        conn.end();
    }

}, 1000);
