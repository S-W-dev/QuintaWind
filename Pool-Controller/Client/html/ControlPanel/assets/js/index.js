const socket = io('localhost:3000');

let jets = document.getElementById("jets");
let waterfalls = document.getElementById("waterfalls");
let cleaning = document.getElementById("cleaning");

let poolSlider = document.getElementById("poolSlider");
let spaSlider = document.getElementById("spaSlider");
let poolSetLabel = document.getElementById("poolSet");
let spaSetLabel = document.getElementById("spaSet");

let read_only = ["version", "status", "poolTemp", "spaTemp", "airTemp", "saltPPM", "ph", "saturation", "isSpaActive", "isPoolActive", "calcium", "cyanuricAcid", "alkalinity", "saltCellInstalled", "degC"];

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

poolSlider.addEventListener('input', function (evt) {
     poolSetLabel.innerHTML = this.value;
});

spaSlider.addEventListener('input', function (evt) {
     spaSetLabel.innerHTML = this.value;
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
    for (var i = 0; i < Object.keys(data).length; i++) {
        if (read_only.includes(Object.keys(data)[i])) {
            //readonly, update values accordingly
            try {
                document.getElementById(Object.keys(data)[i]).innerHTML = Object.values(data)[i];
            } catch {
                console.log("You didnt add a p tag for this one");
            }
        }
    }
    if (data.waterfalls == "on") {
        ////WaterfallsLabel.innerHTML = "Enabled";
        waterfalls.checked = true;
    } else {
        waterfalls.checked = false;
    }
    if (data.jets == "on") {
        jets.checked = true;
        ////JetsLabel].innerHTML = "Enabled";
    } else {
        jets.checked = false;
    }
    if (data.cleaner == "on") {
        cleaning.checked = true;
        ////cleaningLabel.innerHTML = "Enabled";
    } else {
        cleaning.checked = false;
    }
    poolSlider.value = data.pool_setpoint;
    spaSlider.value = data.pool_setpoint;
    poolSetLabel.innerHTML = data.pool_setpoint;
    spaSetLabel.innerHTML = data.spa_setpoint;
    /*if (data.poolTemp.toString().split(" ").length > 1) {
        poolTempLabel.innerHTML = data.value.split(" ")[0] + "&deg (Last)";
    } else {
        poolTempLabel.innerHTML = data.value + "&deg";
    }
    if (data.spaTemp.toString().split(" ").length > 1) {
        spaTempLabel.innerHTML = data.value.split(" ")[0] + "&deg (Last)";
    } else {
        spaTempLabel.innerHTML = data.value + "&deg";
    }*/

    /*$("#pool").roundSlider({
        value: data.pool_setpoint
    });
    $("#pool").roundSlider({
        value: data.spa_setpoint
    });*/
});

Circuit = (circuitName, value) => {
    console.log("Changed " + circuitName);
    socket.emit('circuit', {
        "circuit": circuitName,
        "value": value
    });
}