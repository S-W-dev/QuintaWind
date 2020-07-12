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
            console.log(unit);
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
            }
        }, 1000);
    });
}

let connect = (client) => {
    var obj = {};
    client.on('loggedIn', function () {
        this.getVersion();
    }).on('version', function (version) {
        this.getPoolStatus();
        console.log(' version=' + version.version);
        obj.version = version.version;
    }).on('poolStatus', function (status) {
        this.getChemicalData();
        console.log(' pool ok=' + status.ok);
        console.log(' pool temp=' + status.currentTemp[0]);
        console.log(' air temp=' + status.airTemp);
        console.log(' salt ppm=' + status.saltPPM);
        console.log(' pH=' + status.pH);
        console.log(' saturation=' + status.saturation);
        console.log(' spa active=' + status.isSpaActive());
        console.log(' pool active=' + status.isPoolActive());
        obj.status = status.ok;
        obj.currentTemp = status.currentTemp[0];
        obj.airTemp = status.airTemp;
        obj.saltPPM = status.saltPPM;
        obj.pH = status.pH;
        obj.saturation = status.saturation;
        obj.spa = {
            isActive: status.isSpaActive()
        };
        obj.pool = {
            isActive: status.isPoolActive()
        };
    }).on('chemicalData', function (chemData) {
        this.getSaltCellConfig();
        console.log(' calcium=' + chemData.calcium);
        console.log(' cyanuric acid=' + chemData.cyanuricAcid);
        console.log(' alkalinity=' + chemData.alkalinity);
        obj.calcium = chemData.calcium;
        obj.cyanuricAcid = chemData.cyanuricAcid;
        obj.alkalinity = chemData.alkalinity;
    }).on('saltCellConfig', function (saltCellConfig) {
        this.getControllerConfig();
        console.log(' salt cell installed=' + saltCellConfig.installed);
        obj.saltCellInstalled = saltCellConfig.installed;
    }).on('controllerConfig', function (config) {
        console.log(' controller is in celsius=' + config.degC);
        obj.degC = config.degC;
        client.close();
    }).on('loginFailed', function () {
        console.log(' unable to login (wrong password?)');
        obj.isError = true;
        obj.error = 'unable to login (wrong password?)';
        client.close();
        return obj;
    });

    client.connect();

}

Start();