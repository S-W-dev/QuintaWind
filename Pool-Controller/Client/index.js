//nodejs screenlogic reference page
//https://github.com/parnic/node-screenlogic

//mysql reference page
//https://www.w3schools.com/nodejs/nodejs_mysql_create_db.asp


const mysql = require('mysql');
const express = require('express');
const app = express();
const settings = require("./settings").settings;
const socket = require('socket.io');
const http = require("http");
const ScreenLogic = require("node-screenlogic");
const {
    SLSetHeatSetPointMessage
} = require('node-screenlogic/messages');
const {
    exec
} = require("child_process");

let conn = mysql.createConnection(settings.mysqlconnection);
let server = http.createServer(app);
let io = socket(server);

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
            obj.spaTemp = obj.spaTemp + " (Last Active)";
        }
        if (!obj.isPoolActive == "1") {
            obj.poolTemp = obj.poolTemp + " (Last Active)";
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
sendCircuitValues();
}



app.get("/data", (req, res) => {
    try {
        var url = new URL(decodeURIComponent(req.protocol + '://' + req.get('host') + req.url)).searchParams.get('query');
        conn.query(url, (err, rows) => {
            res.send("<textarea style='width:100%;height:100%;'>" + JSON.stringify(rows, null, "\t") + "\n\n\nTotal: " + rows.length + "</textarea>");
        });
    } catch (x) {
        conn.query("select * from pool_data", (err, rows) => {
            res.send("<textarea style='width:100%;height:100%;'>" + JSON.stringify(rows, null, "\t") + "</textarea>");
        });
    }
});
app.get("/circuit/*", (req, res) => {
    //connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, settings.password);
    setTimeout(()=>{

        var params = req.url.split("/");
        if (params.length == 4) {
            var circuit = params[2];
            var value = params[3];
            switch (circuit) {
                case "waterfalls":
                    conn.query(`UPDATE circuit_history set waterfalls='${value}'`, (err, result) => {
                        if (err) throw err;
                    });
                    switch (value) {
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
                    conn.query(`UPDATE circuit_history set jets='${value}'`, (err, result) => {
                        if (err) throw err;
                    });
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
                case "pool":
                    switch (value) {
                        case "on":
                            //turn on heater TODO
                            break;
                        case "off":
                            //turn off heater TODO
                            break;
                        default:
                            //console.log("Pool: " + value);
                            try {
                                value = parseInt(value);
                                setPoolSetPoint(value);
                                res.send("Sucess!");
                            } catch {
                                res.send("Invalid value")
                            }
                    }
                    break;
                case "spa":
                    switch (value) {
                        case "on":
                            //turn on heater TODO
                            break;
                        case "off":
                            //turn off heater TODO
                            break;
                        default:
                            try {
                                value = parseInt(value);
                                setSpaSetPoint(value);
                            } catch {
                                res.send("Invalid value")
                            }
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

    }, 1000);
});
app.get("/cp", (req, res) => {
    res.send("<script>window.location.href='/controlpanel';</script>");
});
app.get("/", (req, res) => {
    res.send("<script>window.location.href='/controlpanel';</script>");
});
app.get("/reset", (req, res) => {
    mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: ""
    }).query("drop database pentair;", (err, result) => {
        if (err) {
            res.send(err);
            throw err;
        } else res.send(result);
    });
    console.log("\n\n\n\n\n\n\nPlease Run 'node setup.js' before next launch.\n\n\n\n\n\n\n")
    process.exit(1);
})
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
let sendCircuitValues = () => {
    conn.query("SELECT * FROM circuit_history", (err, result1) => {
        var circuit_history = result1[0];
        conn.query("SELECT * FROM pool_data", (err, result2) => {
            var pool_data = result2[result2.length - 1];
            setTimeout(() => {
                //console.log(circuit_history);
                //console.log(circuit_history, pool_data);
                sendValue({
                    ...pool_data,
                    ...circuit_history
            });
            }, 1000);
        });
    });
}
let sendValue = (value) => {
    //console.log(value);
    io.emit('circuit', value);
}

function setPoolSetPoint(setpoint) {
    console.log(setpoint);
    THIS.setSetPoint(0, 0, setpoint);
}

function setSpaSetPoint(setpoint) {
    console.log(setpoint);
    THIS.setSetPoint(0, 1, setpoint);
}

function turnOnWaterFalls() {
    //console.log(THIS);
    THIS.setCircuitState(0, 502, 1);
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
    conn.query(`UPDATE circuit_history set lights='${color}'`, (err, result) => {
        if (err) throw err;
    });
    THIS.sendLightCommand(0, color_codes[color.toString()]);
}


io.on('connection', (socket) => {
    sendCircuitValues();

    socket.on('reload', (data) => {
        sendCircuitValues();
    });

    socket.on('circuit', (data) => {
        http.get("http://localhost:3000/circuit/" + data.circuit + "/" + data.value, (resp) => {
            var data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                socket.emit('response', data);
                console.log(data);
            });
        });
    });

});

//let THIS;

// InitPentair(settings.pentair, () => {
// connection = new ScreenLogic.UnitConnection(unit.port, unit.ipAddr, settings.password);
// THIS = connection;
// });

server.listen(3000);
function dbUpdater() {
    exec("start cmd.exe /K node db-updater.js", (error, stdout, stderr) => {
        if (error || stderr) {
            console.log(`[ERROR]: ${error.message}`);
            return;
        }
        console.log(`[STDOUT] db-updater: ${stdout}`);
    });
}
Start();

//dbUpdater();