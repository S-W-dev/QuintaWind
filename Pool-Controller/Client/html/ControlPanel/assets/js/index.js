const socket = io('localhost:3000');

//let poolTemp = document.getElementById("PoolTemp");
//let spaTemp = document.getElementById("SpaTemp");

let jets = document.getElementById("Jets");
let waterfalls = document.getElementById("Waterfalls");
let cleaning = document.getElementById("Cleaning");

let poolTempLabel = document.getElementById("PoolLabel");
let spaTempLabel = document.getElementById("SpaLabel");

//let ////JetsLabel] = document.getElementById("////JetsLabel]]");
//let //WaterfallsLabel = document.getElementById("//WaterfallsLabel");
//let ////cleaningLabel = document.getElementById("////cleaningLabel");

$("#pool").roundSlider({
    sliderType: "min-range",
    circleShape: "pie",
    value: 85,
    startAngle: 315,
    editableTooltip: true,
    radius: ($(".arc-slider").width() - 10) / 2,
    width: 6,
    handleSize: "+32",
    tooltipFormat: function (args) {
        console.log(args.value);
        socket.emit("circuit", {
            circuit: "pool",
            value: args.value
        })
        return args.value + "&deg";
    }
});

$("#spa").roundSlider({
    sliderType: "min-range",
    circleShape: "pie",
    value: 85,
    startAngle: 315,
    editableTooltip: true,
    radius: ($(".arc-slider").width() - 10) / 2,
    width: 6,
    handleSize: "+32",
    tooltipFormat: function (args) {
        console.log(args.value);
        socket.emit("circuit", {
            circuit: "spa",
            value: args.value
        })
        return args.value + "&deg";
    }
});

// poolTemp.addEventListener('input', function (evt) {
//     poolTempLabel.innerHTML = this.value;
// });

// spaTemp.addEventListener('input', function (evt) {
//     spaTempLabel.innerHTML = this.value;
// });

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
    var circuit = data.circuit,
        value = data.value;
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
        case "pooltemp":
            if (data.value.toString().split(" ").length > 1) {
                poolTempLabel.innerHTML = data.value.split(" ")[0] + "&deg (Last)";
            } else {
                poolTempLabel.innerHTML = data.value + "&deg";
            }
            break;
        case "spatemp":
            if (data.value.toString().split(" ").length > 1) {
                spaTempLabel.innerHTML = data.value.split(" ")[0] + "&deg (Last)";
            } else {
                spaTempLabel.innerHTML = data.value + "&deg";
            }
            break;
        case "pool_setpoint":
            $("#pool").roundSlider({
                value: data.value
            });
            break;
        case "spa_setpoint":
            $("#pool").roundSlider({
                value: data.value
            });
            break;
        default:
            console.log("Invalid Circuit")
            break;
    }
});

Circuit = (circuitName, value) => {
    console.log("Changed " + circuitName);
    socket.emit('circuit', {
        "circuit": circuitName,
        "value": value
    });
}