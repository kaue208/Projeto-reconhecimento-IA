const URL = "./";
let model, webcam, ctx, labelContainer, maxPredictions;
let inicializar = false;

async function init() {

    if (inicializar) {
        return;
    }

    inicializar = true;
    const modelURL = URL + "Pose/model.json";
    const metadataURL = URL + "Pose/metadata.json";

    // Carrega modelo e metadados
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configurar webcam
    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Canvas
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    labelContainer = document.getElementById("label-container");
    labelContainer.style.visibility = "visible";
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

let ultimaatualizacaotempo = 0;
const atrasotempo = 1000;

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    const agora = Date.now();

    let probabilidadefocado = 0;
    let probabilidadedistraido = 0;

    if (agora - ultimaatualizacaotempo > atrasotempo) {
        ultimaatualizacaotempo = agora;

        // Atualiza a interface de predições
        for (let i = 0; i < maxPredictions; i++) {
            let percent = Math.round(prediction[i].probability * 100);
            let proximo = Math.round(percent / 25) * 25;
            if (proximo > 100) proximo = 100;
            labelContainer.childNodes[i].innerHTML =
                prediction[i].className + ": " + proximo + "%";

            if (prediction[i].className === "focado") {
                probabilidadefocado = percent;
            } else if (prediction[i].className === "distraido") {
                probabilidadedistraido = percent;
            }
        }

        // --- Lógica baseada na versão de IMAGEM ---
        if (probabilidadedistraido > 75) {
        alerta.style.visibility = "visible";
        alerta.innerText = "Não se distraia!";
        tempo.style.visibility = "visible";
        audio.setAttribute("autoplay", "");
        audio.play();
        iniciartempo();
        } else if (probabilidadefocado > 75) {
            alerta.style.visibility = "visible";
            alerta.innerText = "Foco total!";
            parartempo();
        } else {
            alerta.style.visibility = "hidden";
            alerta.innerText = "";
            parartempo();
        }
    }
    
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

// ===== Controle de tempo =====
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
    const tempoDecorrido = ((Date.now() - tempoinicial) / 1000).toFixed(1);
    document.getElementById("timer").innerText =
        "Tempo distraído: " + tempoDecorrido + "s";
}

// ===== Elementos HTML =====
const alerta = document.getElementById("mensagem");
const tempo = document.getElementById("timer");
const audio = document.getElementById("audio");
labelContainer = document.getElementById("label-container");
