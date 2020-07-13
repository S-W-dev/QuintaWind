//nodejs screenlogic reference page
//https://github.com/parnic/node-screenlogic

//mysql reference page
//https://www.w3schools.com/nodejs/nodejs_mysql_create_db.asp


const mysql = require('mysql');
const ScreenLogic = require("node-screenlogic");
const express = require('express');
const app = express();
var settings = require("./settings").settings;
const url = require('url');

let conn = mysql.createConnection(settings.mysqlconnection);
let unit;
let obj;
let THIS;

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
        conn.query(`SELECT pentair, password FROM settings`, (err, result) => {
            if (err) throw err;
            //console.log("Pentair device: " + result[0].pentair);
            //console.log("Pentair password: " + result[0].password);
            StartPentair(result[0].pentair);
            password = result[0].password;
        });
        setTimeout(() => {
            if (unit != undefined) {
                let connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, password);
                process.stdout.write("Connecting...\r");
                obj = {};
                console.time("Connected in");
                var start = new Date(), connecting = true;
                connect(connection);
                var end = new Date(), connecting = false;
                var time = end - start;
                console.timeEnd("Connected in")
                console.log("Starting...");
                var i = 0;
                setInterval(()=>{
                   try {
                       //console.log(i);
                        obj = {};
                        setTimeout(()=>{

                            THIS.StartLoop();

                        }, 1000);
                        //console.log("test");
                        setTimeout(() => {
                            if (i == 105) {
                                console.log('Uploading data');
                                uploadData();
                                i = 0;
                            } else {
                                //console.log('refreshing connection');
                                connection.getControllerConfig();
                            }
                        }, 5000);

                   } catch {
                       console.log("An error happened ): try rerunning");
                   }
                i++
                }, settings.interval);
            }
        }, 1000);
    });
}

let connect = (client) => {
    client.on('loggedIn', function () {
        this.getVersion();
        THIS = this;
        THIS.StartLoop = THIS.getVersion;
    }).on('version', function (version) {
        this.getPoolStatus();
        obj.version = version.version;
        //console.log(version.version);
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
        //client.close();
    }).on('loginFailed', function () {
        obj.isError = true;
        obj.error = 'unable to login (wrong password?)';
        client.close();
    });

    client.connect();

}


let uploadData = () => {
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
        //console.log("Rows affected: " + result.affectedRows);
    });
}

//express
app.get("/data", (req, res) => {
//if (req.get('host') == 'localhost:3000') {

        try {
            var url = new URL(decodeURIComponent(req.protocol + '://' + req.get('host') + req.url)).searchParams.get('query');
            //console.log(decodeURIComponent(req.protocol + '://' + req.get('host') + req.url));
            conn.query(url, (err, rows) => {

                res.send("<textarea style='width:100%;height:100%;'>" + JSON.stringify(rows, null, "\t") + "\n\n\nTotal: " + rows.length + "</textarea>");

            });
        } catch (x) {
            //console.error(x);
            conn.query("select * from pool_data", (err, rows) => {

                res.send("<textarea style='width:100%;height:100%;'>" + JSON.stringify(rows, null, "\t") + "</textarea>");

            });
        }


// } else {
//     res.send("<script>window.onload = () => {window.location.href = '/'}</script>");
// }
});

app.get("/circuit/*", (req, res) => {

    var params = req.url.split("/");
    
    if (params.length == 4) {
        var circuit = params[2];
        var value = params[3];

        switch(circuit) {

            case "waterfalls":
                switch(value) {
                    case "on":
                        turnOnWaterFalls();
                        res.send("Success!");
                        break;
                    case "off":
                        turnOffWaterFalls();
                        res.send("Success!");
                        break;
                    default:
                        res.send("Invalid value");
                        break;
                }
                break;
            case "jets":
            switch (value) {
                case "on":
                    turnOnJets();
                    res.send("Success!");
                    break;
                case "off":
                    turnOffJets();
                    res.send("Success!");
                    break;
                default:
                    res.send("Invalid value");
                    break;
            }
            break;
            case "lights":
            if (Object.keys(color_codes).includes(value)) {
                changePoolColor(value);
                res.send("Success!");
            } else res.send("Invalid color code");
            break;

            default:
                res.send("Invalid request.");
                break;

        }

    } else {
        res.send("Invalid request.");
    }

});

app.use(express.static(__dirname + "/html"));

let color_codes = {
    on: ScreenLogic.LIGHT_CMD_LIGHTS_ON,
    off: ScreenLogic.LIGHT_CMD_LIGHTS_OFF,
    set: ScreenLogic.LIGHT_CMD_COLOR_SET,
    sync: ScreenLogic.LIGHT_CMD_COLOR_SYNC,
    swim: ScreenLogic.LIGHT_CMD_COLOR_SWIM,
    party: ScreenLogic.LIGHT_CMD_COLOR_MODE_PARTY,
    romance: ScreenLogic.LIGHT_CMD_COLOR_MODE_ROMANCE,
    caribbean: ScreenLogic.LIGHT_CMD_COLOR_MODE_CARIBBEAN,
    american: ScreenLogic.LIGHT_CMD_COLOR_MODE_AMERICAN,
    royal: ScreenLogic.LIGHT_CMD_COLOR_MODE_ROYAL,
    sunset: ScreenLogic.LIGHT_CMD_COLOR_MODE_SUNSET,
    set_save: ScreenLogic.LIGHT_CMD_COLOR_SET_SAVE,
    set_recall: ScreenLogic.LIGHT_CMD_COLOR_SET_RECALL,
    blue: ScreenLogic.LIGHT_CMD_COLOR_BLUE,
    green: ScreenLogic.LIGHT_CMD_COLOR_GREEN,
    red: ScreenLogic.LIGHT_CMD_COLOR_RED,
    white: ScreenLogic.LIGHT_CMD_COLOR_WHITE,
    purple: ScreenLogic.LIGHT_CMD_COLOR_PURPLE
}

function turnOnWaterFalls() {
    THIS.setCircuitState(0, settings.waterfalls, 1);
    console.log('enabling waterfalls');
}

function turnOffWaterFalls() {
    THIS.setCircuitState(0, settings.waterfalls, 0);
    console.log('disabling waterfalls');
}

function turnOnJets() {
    THIS.setCircuitState(0, settings.jets, 1);
    console.log('enabling jets');
}

function turnOffJets() {
    THIS.setCircuitState(0, settings.jets, 0);
    console.log('disabling jets');
}

function changePoolColor(color) {
    THIS.sendLightCommand(0, color_codes[color.toString()]);
}

function turnOnLights() {
    THIS.sendLightCommand(0, color_codes.on);
}

function turnOffLights() {
    THIS.sendLightCommand(0, color_codes.off);
}


app.listen(3000);
Start();