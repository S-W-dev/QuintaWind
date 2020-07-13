const socket = io('192.168.0.159:3000');

let poolTemp = document.getElementById("PoolTemp");
let spaTemp = document.getElementById("SpaTemp");

let jets = document.getElementById("Jets");
let waterfalls = document.getElementById("Waterfalls");
let cleaning = document.getElementById("Cleaning");

let poolTempLabel = document.getElementById("PoolTempLabel");
let spaTempLabel = document.getElementById("SpaTempLabel");

//let ////JetsLabel] = document.getElementById("////JetsLabel]]");
//let //WaterfallsLabel = document.getElementById("//WaterfallsLabel");
//let ////cleaningLabel = document.getElementById("////cleaningLabel");

poolTemp.addEventListener('input', function (evt) {
    poolTempLabel.innerHTML = this.value;
});

spaTemp.addEventListener('input', function (evt) {
    spaTempLabel.innerHTML = this.value;
});

jets.addEventListener('input', function (evt) {
    if (this.checked) {
        //JetsLabel].innerHTML = "Enabled";
        Circuit("jets", "on");
    } else {
        //JetsLabel].innerHTML = "Disabled";
        Circuit("jets", "off");
    }
});

waterfalls.addEventListener('input', function (evt) {
    if (this.checked) {
        ////WaterfallsLabel.innerHTML = "Enabled";
        Circuit("waterfalls", "on");
    } else {
        ////WaterfallsLabel.innerHTML = "Disabled";
        Circuit("waterfalls", "off");
    }
});

cleaning.addEventListener('input', function (evt) {
    if (this.checked) {
        //cleaningLabel.innerHTML = "Enabled";
        Circuit("cleaner", "on");
    } else {
        //cleaningLabel.innerHTML = "Disabled";
        Circuit("cleaner", "off");
    }
});

socket.on('connect', () => {
    console.log(socket.id);
});

socket.on('response', (data) => {
    console.log(data);
});

socket.on('circuit', (data) => {
    var circuit = data.circuit, value = data.value;
    console.log(data.circuit);
    switch (circuit) {
        case "waterfalls":
            if (data.value == "on") {
                ////WaterfallsLabel.innerHTML = "Enabled";
                waterfalls.checked = true;
            } else {
                waterfalls.checked = false;
            }
            break;
        case "jets":
            console.log(data.value);
            if (data.value == "on") {
                jets.checked = true;
                ////JetsLabel].innerHTML = "Enabled";
            } else {
                jets.checked = false;
            }
            break;
        case "cleaner":
            if (data.value == "on") {
                cleaning.checked = true;
                ////cleaningLabel.innerHTML = "Enabled";
            } else {
                cleaning.checked = false;
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