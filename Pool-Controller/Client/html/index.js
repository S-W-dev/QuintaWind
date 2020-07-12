let poolTempSlider = document.getElementById("poolTempSlider");
let spaTempSlider = document.getElementById("spaTempSlider");

let poolTempLabel = document.getElementById("poolTempLabel");
let spaTempLabel = document.getElementById("spaTempLabel");

poolTempSlider.addEventListener('input', function (evt) {
    poolTempLabel.innerHTML = this.value;
});

spaTempSlider.addEventListener('input', function (evt) {
    spaTempLabel.innerHTML = this.value;
});