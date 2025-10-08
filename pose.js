// Caminho base dos arquivos do modelo
const URL = "./";
let model, webcam, ctx, labelContainer, maxPredictions;
let inicializar = false;

// Função principal para inicializar o modelo e a webcam
async function init() {

    // Evita que o modelo seja inicializado mais de uma vez
    if (inicializar) {
        return;
    }
    inicializar = true;

    // URLs do modelo e dos metadados (Teachable Machine Pose)
    const modelURL = URL + "Pose/model.json";
    const metadataURL = URL + "Pose/metadata.json";

    // Carrega o modelo e seus metadados
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configura a webcam
    const size = 200;
    const flip = true; // espelha a imagem para parecer um espelho
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup(); // pede permissão da webcam
    await webcam.play();  // inicia a captura de vídeo
    window.requestAnimationFrame(loop); // inicia o loop de análise

    // Configura o canvas para desenhar as poses
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    // Exibe o container de resultados
    labelContainer = document.getElementById("label-container");
    labelContainer.style.visibility = "visible";
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

// Loop principal que atualiza a webcam e executa a predição
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Controle de tempo entre predições (1 segundo)
let ultimaatualizacaotempo = 0;
const atrasotempo = 1000;

// Função que realiza a predição com base na pose detectada
async function predict() {
    // Estima a pose e obtém as predições do modelo
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    const agora = Date.now();

    let probabilidadefocado = 0;
    let probabilidadedistraido = 0;

    // Atualiza apenas a cada 1 segundo
    if (agora - ultimaatualizacaotempo > atrasotempo) {
        ultimaatualizacaotempo = agora;

        // Atualiza as porcentagens na interface
        for (let i = 0; i < maxPredictions; i++) {
            let percent = Math.round(prediction[i].probability * 100);
            let proximo = Math.round(percent / 25) * 25; // arredonda para múltiplos de 25
            if (proximo > 100) proximo = 100;

            labelContainer.childNodes[i].innerHTML =
                prediction[i].className + ": " + proximo + "%";

            // Guarda as probabilidades de cada classe
            if (prediction[i].className === "focado") {
                probabilidadefocado = percent;
            } else if (prediction[i].className === "distraido") {
                probabilidadedistraido = percent;
            }
        }

        // Define as ações conforme o resultado
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
    
    // Desenha a pose no canvas
    drawPose(pose);
}

// Função que desenha os pontos e esqueletos da pose no canvas
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

// Controle de tempo de distração
let iniciotempo = false;
let tempoinicial = 0;
let intervalo;

// Inicia o cronômetro de distração
function iniciartempo() {
    if (!iniciotempo) {
        iniciotempo = true;
        tempoinicial = Date.now();
        intervalo = setInterval(atualizartempo, 100);
    }
}

// Para o cronômetro
function parartempo() {
    iniciotempo = false;
    clearInterval(intervalo);
}

// Atualiza o tempo de distração na tela
function atualizartempo() {
    const tempoDecorrido = ((Date.now() - tempoinicial) / 1000).toFixed(1);
    document.getElementById("timer").innerText =
        "Tempo distraído: " + tempoDecorrido + "s";
}

// Elementos HTML usados no código
const alerta = document.getElementById("mensagem");
const tempo = document.getElementById("timer");
const audio = document.getElementById("audio");
labelContainer = document.getElementById("label-container");
