const socket = io('http://localhost:3000');

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
    } else {
        jetsLabel.innerHTML = "Disabled";
    }
});

waterfalls.addEventListener('input', function (evt) {
    if (this.checked) {
        waterfallsLabel.innerHTML = "Enabled";
    } else {
        waterfallsLabel.innerHTML = "Disabled";
    }
});

cleaning.addEventListener('input', function (evt) {
    if (this.checked) {
        cleaningLabel.innerHTML = "Enabled";
    } else {
        cleaningLabel.innerHTML = "Disabled";
    }
});

socket.on('connect', () => {
    console.log(socket.id);
});