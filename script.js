const URL = "./";

let model, webcam, labelContainer, maxPredictions;
let inicializar = false;

    // Load the image model and setup the webcam
async function init() {

    if (inicializar) {
        return
    }

    inicializar = true;
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
   
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    labelContainer.style.visibility="visible";
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

let ultimaatualizacaotempo = 0;
const atrasotempo = 1000;
// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    const agora = Date.now();
    let probabilidadecelular = 0;
    if (agora - ultimaatualizacaotempo > atrasotempo) {
        ultimaatualizacaotempo = agora;
    for (let i = 0; i < maxPredictions; i++) {
            let percent = Math.round(prediction[i].probability * 100);
            let proximo = Math.round(percent /25) * 25;
            if (proximo > 100) proximo = 100;
            labelContainer.childNodes[i].innerHTML = prediction[i].className + ": " + proximo + "%";

            if (prediction[i].className === "celular") {
                probabilidadecelular = percent;
                
            }
    }   
    if (probabilidadecelular > 75) {
        alerta.style.visibility = "visible";
        alerta.innerText = "Deixe o celular de lado"
        tempo.style.visibility = "visible";
        iniciartempo();
    } else {
        alerta.style.visibility = "hidden";
        alerta.innerText = "";
        parartempo();
    }
}
    
    }

let iniciotempo = false;
let tempoinicial = 0;
let intervalo;

function iniciartempo() {
    if (!iniciotempo) {
        iniciotempo = true;
        tempoinicial = Date.now();
        intervalo = setInterval(atualizartempo, 100);
    }
}

function parartempo() {
    iniciotempo = false;
    clearInterval(intervalo);
}

function atualizartempo() {
    const tempo = ((Date.now() - tempoinicial) / 1000).toFixed(1);
    document.getElementById("timer").innerText = "Tempo distraido: " + tempo + "s";
}

const alerta = document.getElementById("mensagem");
const tempo = document.getElementById("timer");

