const socket = io('192.168.0.159:3000');

let poolTemp = document.getElementById("PoolTemp");
let spaTemp = document.getElementById("SpaTemp");

let jets = document.getElementById("Jets");
let waterfalls = document.getElementById("Waterfalls");
let cleaning = document.getElementById("Cleaning");

let poolTempLabel = document.getElementById("PoolTempLabel");
let spaTempLabel = document.getElementById("SpaTempLabel");

let jetsLabel = document.getElementById("JetsLabel");
let waterfallsLabel = document.getElementById("WaterfallsLabel");
let cleaningLabel = document.getElementById("CleaningLabel");

poolTemp.addEventListener('input', function (evt) {
    poolTempLabel.innerHTML = this.value;
});

spaTemp.addEventListener('input', function (evt) {
    spaTempLabel.innerHTML = this.value;
});

jets.addEventListener('input', function (evt) {
    if (this.checked) {
        jetsLabel.innerHTML = "Enabled";
        Circuit("jets", "on");
    } else {
        jetsLabel.innerHTML = "Disabled";
        Circuit("jets", "off");
    }
});

waterfalls.addEventListener('input', function (evt) {
    if (this.checked) {
        waterfallsLabel.innerHTML = "Enabled";
        Circuit("waterfalls", "on");
    } else {
        waterfallsLabel.innerHTML = "Disabled";
        Circuit("waterfalls", "off");
    }
});

cleaning.addEventListener('input', function (evt) {
    if (this.checked) {
        cleaningLabel.innerHTML = "Enabled";
        Circuit("cleaning", "on");
    } else {
        cleaningLabel.innerHTML = "Disabled";
        Circuit("cleaning", "off");
    }
});

socket.on('connect', () => {
    console.log(socket.id);
});

socket.on('response', (data) => {
    console.log(data);
});

socket.on('circuit', (data) => {
    console.log(data.circuit);
    switch (circuit) {
        case "waterfalls":
            if (data.value == "on") {
                waterfallsLabel.checked = true;
            } else {
                waterfallsLabel.checked = false;
            }
            break;
        case "jets":
            if (data.value == "on") {
                jetsLabel.checked = true;
            } else {
                jetsLabel.checked = false;
            }
            break;
        case "cleaning":
            if (data.value == "on") {
                cleaningLabel.checked = true;
            } else {
                cleaningLabel.checked = false;
            }
            break;
        default:
            console.log("Invalid Circuit")
            break;
    }
});

Circuit = (circuitName, value) => {
    console.log("Changed " + circuitName);
    socket.emit('circuit', { "circuit": circuitName, "value": value });
}