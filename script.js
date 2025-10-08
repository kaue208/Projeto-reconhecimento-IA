// Caminho base dos arquivos do modelo
const URL = "./";

// Função principal que inicializa o modelo e a webcam
async function init() {
    // URLs do modelo e dos metadados (Teachable Machine)
    const modelURL = URL + "Imagem/model.json";
    const metadataURL = URL + "Imagem/metadata.json";

    // Carrega o modelo e os metadados
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configura a webcam
    const flip = true; // define se a imagem da webcam será espelhada
    webcam = new tmImage.Webcam(200, 200, flip); // largura, altura, flip
    await webcam.setup(); // solicita acesso à webcam
    await webcam.play(); // inicia a captura de vídeo
    window.requestAnimationFrame(loop); // inicia o loop de predição

    // Adiciona o vídeo da webcam na página
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    labelContainer.style.visibility = "visible";

    // Cria elementos para exibir as predições
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

// Loop principal que atualiza a webcam e chama as predições
async function loop() {
    webcam.update(); // atualiza o frame da webcam
    await predict(); // faz a predição
    window.requestAnimationFrame(loop); // repete o processo
}

// Controle de tempo entre predições
let ultimaatualizacaotempo = 0;
const atrasotempo = 1000; // intervalo de 1 segundo entre atualizações

// Função que realiza a predição do modelo
async function predict() {
    const prediction = await model.predict(webcam.canvas); // obtém predições do modelo
    const agora = Date.now();
    let probabilidadecelular = 0;
    let probabilidadelivro = 0;

    // Garante que as predições só sejam atualizadas a cada segundo
    if (agora - ultimaatualizacaotempo > atrasotempo) {
        ultimaatualizacaotempo = agora;

        // Exibe a porcentagem de probabilidade para cada classe
        for (let i = 0; i < maxPredictions; i++) {
            let percent = Math.round(prediction[i].probability * 100);
            let proximo = Math.round(percent / 25) * 25; // arredonda para múltiplos de 25
            if (proximo > 100) proximo = 100;

            // Atualiza o texto na tela
            labelContainer.childNodes[i].innerHTML = prediction[i].className + ": " + proximo + "%";

            // Guarda a probabilidade de cada classe principal
            if (prediction[i].className === "celular") {
                probabilidadecelular = percent;
            } else if (prediction[i].className === "livro") {
                probabilidadelivro = percent;
            }
        }

        // Define ações de acordo com a detecção
        if (probabilidadecelular > 75) {
            alerta.style.visibility = "visible";
            alerta.innerText = "Deixe o celular de lado";
            tempo.style.visibility = "visible";
            audio.setAttribute("autoplay", "");
            audio.play();
            iniciartempo();
        } else if (probabilidadelivro > 75) {
            alerta.style.visibility = "visible";
            alerta.innerText = "Foco";
        } else {
            alerta.style.visibility = "hidden";
            alerta.innerText = "";
            parartempo();
        }
    }
}

// Controle de tempo distraído

let iniciotempo = false;
let tempoinicial = 0;
let intervalo;

// Inicia a contagem do tempo de distração
function iniciartempo() {
    if (!iniciotempo) {
        iniciotempo = true;
        tempoinicial = Date.now();
        intervalo = setInterval(atualizartempo, 100);
    }
}

// Para a contagem de tempo
function parartempo() {
    iniciotempo = false;
    clearInterval(intervalo);
}

// Atualiza o tempo de distração na tela
function atualizartempo() {
    const tempo = ((Date.now() - tempoinicial) / 1000).toFixed(1);
    document.getElementById("timer").innerText = "Tempo distraído: " + tempo + "s";
}

// Referências aos elementos da página
const alerta = document.getElementById("mensagem");
const tempo = document.getElementById("timer");
const audio = document.getElementById("audio");
