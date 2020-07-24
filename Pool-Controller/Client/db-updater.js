const mysql = require('mysql');
const ScreenLogic = require("node-screenlogic");
const settings = require("./settings").settings;

let conn = mysql.createConnection(settings.mysqlconnection);

let unit;
let obj;
let THIS;


function InitPentair(pentair, callback) {
    let remote = new ScreenLogic.RemoteLogin(pentair);
    remote.on('gatewayFound', function (_unit) {
        remote.close();
        if (_unit && _unit.gatewayFound) {
            unit = _unit;
            console.log('unit ' + settings.pentair + ' found at ' + _unit.ipAddr + ':' + _unit.port);
            callback();
        } else {
            console.log('no unit found by that name');
        }
    });
    remote.connect();
}

let connect = (client) => {
    var temp = {};
    client.on('loggedIn', function () {
        this.getVersion();
        THIS = this;
        THIS.StartLoop = THIS.getVersion;
    }).on('version', function (version) {
        this.getPoolStatus();
        obj.version = version.version;
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
        temp.circuit_data = status;
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
        obj.circuit_data = [];
        obj.circuit_data[0] = temp.circuit_data;
        obj.circuit_data[1] = config;

        if (!obj.isSpaActive == "1") {
            obj.spaTemp = obj.spaTemp + " (Last)";
        }
        if (!obj.isPoolActive == "1") {
            obj.isPoolActive = obj.isPoolActive + " (Last)";
        }

    }).on('loginFailed', function () {
        client.close();
        throw "Unable to login";
    });
    client.connect();
}

let connection;
let Start = () => {
    InitPentair(settings.pentair, () => {
        connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, settings.password)
        obj = {};
        connect(connection);
        setInterval(() => {
            obj = {};
            THIS.StartLoop();
                setTimeout(uploadData, 1000);
        }, 9000)
    });
}

let uploadData = () => {
    try {
        values = [];
        values.push(Object.values(obj));
        values[0].pop();
        var error;
        conn.query(`INSERT INTO pool_data (version, status, poolTemp, spaTemp, airTemp, saltPPM, pH, saturation, isSpaActive, isPoolActive, calcium, cyanuricAcid, alkalinity, saltCellInstalled, degC) VALUES (?)`, values, (err, result) => {
            if (err) error = err;
            //console.log(error);
            console.log("Uploaded data");
        });
        if (error) throw error;
    } catch (x) {
        console.log(x);
    }
}

Start();
