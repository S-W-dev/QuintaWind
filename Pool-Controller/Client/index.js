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
    var circuit_history, pool_data;
    conn.query("SELECT * FROM circuit_history", (err, result) => {
        circuit_history = result[0];
    });
    conn.query("SELECT * FROM pool_data", (err, result) => {
        pool_data = result[0];
    });
    sendValue("circuit", {...circuit_history, ...pool_data});
}
let sendValue = (circuit, value) => {
    io.emit('circuit', {
        circuit: circuit,
        value: value
    });
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
    THIS.setCircuitState(0, settings.waterfalls, 1);
    //console.log()
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

function turnOnLights() {
    THIS.sendLightCommand(0, color_codes.on);
}

function turnOffLights() {
    THIS.sendLightCommand(0, color_codes.off);
}

function sendInitalData() {
    try {
        io.emit('sliders', {
            pool: obj.circuit_data[0].setPoint[0],
            spa: obj.circuit_data[0].setPoint[1]
        });
    } catch {
        setTimeout(sendInitalData, 1000);
    }
}

function startloop() {
    try {
        THIS.getVersion();
        sendInitalData();
        sendCircuitValues();
    } catch {
        setTimeout(startloop, 1000);
    }

}

io.on('connection', (socket) => {
    startloop();

    socket.on('reload', (data) => {
        startloop();
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

dbUpdater();