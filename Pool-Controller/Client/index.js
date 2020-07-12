//nodejs screenlogic reference page
//https://github.com/parnic/node-screenlogic

//mysql reference page
//https://www.w3schools.com/nodejs/nodejs_mysql_create_db.asp


const mysql = require('mysql');
const ScreenLogic = require("node-screenlogic");
const express = require('express');
const app = express();
const settings = require("./settings").settings;

let conn = mysql.createConnection(settings.mysqlconnection);
let unit;
let obj;

let StartPentair = (pentair, password) => {
    let remote = new ScreenLogic.RemoteLogin(pentair);
    remote.on('gatewayFound', function (_unit) {
        remote.close();
        if (_unit && _unit.gatewayFound) {
            unit = _unit;
            //console.log(unit);
            console.log('unit ' + remote.systemName + ' found at ' + _unit.ipAddr + ':' + _unit.port);
        } else {
            console.log('no unit found by that name');
        }
    });

    remote.connect();
}

let Start = () => {
    // connect the mysql server
    conn.connect(function (err) {
        if (err) throw err;

        // loop
        let password;
        conn.query(`SELECT pentair, password FROM login`, (err, result) => {
            if (err) throw err;
            console.log("Pentair device: " + result[0].pentair);
            console.log("Pentair password: " + result[0].password);
            StartPentair(result[0].pentair);
            password = result[0].password;
        });
        setTimeout(() => {
            if (unit != undefined) {
                let connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, password);
                console.log("connecting");
                connect(connection);
                var logged = false;
                setInterval(() => {
                    if (Object.keys(obj).length == 15) {
                        if (!logged) {
                            console.table(obj);
                            if (!obj.isPoolActive) {
                                obj.poolTemp = obj.poolTemp + " (Last)";
                            }
                            if (!obj.isSpaActive) {
                                obj.spaTemp = obj.spaTemp + " (Last)";
                            }
                            values = [];
                            values.push(Object.values(obj));
                            //console.log(values);
                            conn.query(`INSERT INTO pool_data (version, status, poolTemp, spaTemp, airTemp, saltPPM, pH, saturation, isSpaActive, isPoolActive, calcium, cyanuricAcid, alkalinity, saltCellInstalled, degC) VALUES (?)`, values, (err, result) => {
                                if (err) throw err;
                                console.log("Rows affected: " + result.affectedRows);
                            });
                        }
                        logged = true;
                    }
                }, 1000);
            }
        }, 1000);
    });
}

let connect = (client) => {
    obj = {};
    client.on('loggedIn', function () {
        this.getVersion();
    }).on('version', function (version) {
        this.getPoolStatus();
        obj.version = version.version;
        console.log(version.version);
    }).on('poolStatus', function (status) {
        this.getChemicalData();
        obj.status = status.ok;
        obj.poolTemp = status.currentTemp[0];
        obj.spaTemp = status.currentTemp[1];
        obj.airTemp = status.airTemp;
        obj.saltPPM = status.saltPPM;
        obj.pH = status.pH;
        obj.saturation = status.saturation;
        obj.isSpaActive = status.isSpaActive();
        obj.isPoolActive = status.isPoolActive();
    }).on('chemicalData', function (chemData) {
        this.getSaltCellConfig();
        obj.calcium = chemData.calcium;
        obj.cyanuricAcid = chemData.cyanuricAcid;
        obj.alkalinity = chemData.alkalinity;
    }).on('saltCellConfig', function (saltCellConfig) {
        this.getControllerConfig();
        obj.saltCellInstalled = saltCellConfig.installed;
    }).on('controllerConfig', function (config) {
        obj.degC = config.degC;
        client.close();
    }).on('loginFailed', function () {
        obj.isError = true;
        obj.error = 'unable to login (wrong password?)';
        client.close();
    });

    client.connect();

}


//express
app.get("/", (req, res) => {

    conn.query("select * from pool_data", (err, rows) => {

        res.send("<textarea style='width:100%;height:100%;'>" + JSON.stringify(rows, null, "\t") + "</textarea>");

    });

});

app.listen(3000);

Start();