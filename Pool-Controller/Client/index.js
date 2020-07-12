//nodejs screenlogic reference page
//https://github.com/parnic/node-screenlogic

//mysql reference page
//https://www.w3schools.com/nodejs/nodejs_mysql_create_db.asp


const mysql = require('mysql');
const ScreenLogic = require("node-screenlogic");
const { static } = require('express');
const settings = require("./settings").settings;

let conn = mysql.createConnection(settings.mysqlconnection);

let unit;

let StartPentair = () => {
    let remote = new ScreenLogic.RemoteLogin(settings.pentair);
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

        //create database if it doesnt exist yet
        conn.query(`SHOW DATABASES LIKE 'pentair';`, function (err, result) {
            if (err) throw err;
            if (result.length != 1) {
                console.log("Pentair database doesn't exist. Creating it now...");
                conn.query("CREATE DATABASE pentair", function (err, result) {
                    if (err) throw err;
                });
            }
        });

        // loop
        StartPentair();
        setTimeout(() => {
            if (unit != undefined) {
                let connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, settings.password);
                console.log("connecting");
                connect(connection);
                var logged = false;
                setInterval(() => {
                    if (Object.keys(obj).length == 14) {
                        if (!logged) {
                            console.table(obj);
                            //console.log(obj);
                        }
                        logged = true;
                    }
                }, 1000);
            }
        }, 1000);
    });
}
let obj;
let connect = (client) => {
    obj = {};
    client.on('loggedIn', function () {
        this.getVersion();
    }).on('version', function (version) {
        this.getPoolStatus();
        obj.version = version.version;
    }).on('poolStatus', function (status) {
        this.getChemicalData();
        obj.status = status.ok;
        obj.currentTemp = status.currentTemp[0];
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

Start();