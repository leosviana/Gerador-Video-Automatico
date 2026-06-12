//ARQUIVOS IMPORTADOS
import "./style.css"; // Importa o CSS principal
import {FFmpeg} from "@ffmpeg/ffmpeg"; //Importa o FFMPEG
import overlayFile from "./assets/se-inscreva-youtube.mp4";
//ARQUIVOS UTILIZADOS NO PROJETO(MP3 E MP4):
const videoInput = document.getElementById("videoInput"); //Campo de upload do video principal
const audioInput = document.getElementById("audioInput"); //Campo de upload do audio
let videoFile = null; //Armazena o arquivo de video
let audioFile = null; //Armazena o arquivo de audio
//CANVA DE VIDEO PRINCIPAL:
const canvas = document.getElementById("previewCanvas"); //Canvas onde sera exibido o preview
const ctx = canvas.getContext("2d"); // Contexto 2D do canvas para desenhar imagens e videos
canvas.width = 1280; //Define resolucao de largura do canvas
canvas.height = 720; //Define resolucao de altura do canvas
const loopMode = document.getElementById("loopMode"); //Seleciona o modo de repeticao
let dragging = false; //Controle de arrastar o mouse
let dragOffsetX = 0; //Posição X (vertical)
let dragOffsetY = 0; //Posição Y (horizontal)
//CHROMAKEY - CANVA DE VIDEO OVERLAY(INSCREVA-SE):
const overlayInput = document.getElementById("overlayScale"); //Escala inicial do overlay
//BOTAO EXPORTAR
const btExportar = document.getElementById("btExportar");

// =======================================
// AUDIO PRINCIPAL
// =======================================
const audio = document.createElement("audio"); //Cria o elemento de audio invisivel
audio.loop = false; //Remove o loop
//Captura o MP3 selecionado
audioInput.addEventListener("change", (event) => {
    audioFile = event.target.files[0]; //Salva o arquivo MP3 selecionado pelo usuário
    console.log("Audio carregado:", audioFile);
});

// =======================================
// VIDEO PRINCIPAL
// =======================================
const video = document.createElement("video"); //Cria um elemento de video invisivel
video.muted = true; //Remove audio do preview
video.loop = true; //Faz o video repetir infinitamente
//Captura o MP4 selecionado
videoInput.addEventListener("change", (event) => { 
    videoFile = event.target.files[0]; //Salva o arquivo MP4 selecionado pelo usuário
    console.log("Video carregado:", videoFile);
});

videoInput.addEventListener("change", () => {
  video.src = URL.createObjectURL(videoFile);
  video.play();
});

let reverseDirection = 1;


// =======================================
// OVERLAY (SE INSCREVA)
// =======================================
const overlayPath = overlayFile; //Caminho do overlay
const overlayVideo = document.getElementById("overlayVideo");
overlayVideo.src = overlayPath;
overlayVideo.loop = true; //Repetir continuamente
overlayVideo.muted = true; //Sem audio
overlayVideo.volume = 0;
overlayVideo.playsInline = true; //Necessario para autoplay em alguns navegadores
const chromaCanvas = document.createElement("canvas");
const chromaCtx = chromaCanvas.getContext("2d",{willReadFrequently: true}); //Cria um contexto otimizado para operações frequentes
overlayVideo.addEventListener("loadeddata", () => {
  overlayVideo.play();
});

//Posição do overlay
let overlayScale = 0.5; //Escala overlay (slider)
let overlayX = 400; //Posição horizontal em pixel do canvas
let overlayY = 150; //Posição vertical em pixel do canvas
let overlayPercentX = 0; //Posição relativa (0 e 1). Será usada na exportação para manter a mesma posição
let overlayPercentY = 0; //Posição relativa (0 e 1). Será usada na exportação para manter a mesma posição
let overlayWidth = 0; //Tamanho atual do overlay
let overlayHeight = 0; //Tamanho atual do overlay
overlayInput.addEventListener("input", () => {
  overlayScale = parseFloat(overlayInput.value);
});

//Arrastar overlay com o mouse
canvas.addEventListener("mousedown", (e) =>{
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  if( //Verifica se clicou dentro do overlay
    mouseX >= overlayX &&
    mouseX <= overlayX + overlayWidth &&
    mouseY >= overlayY &&
    mouseY <= overlayY + overlayHeight
){
  dragging = true;
  dragOffsetX = mouseX - overlayX;
  dragOffsetY = mouseY - overlayY;
  console.log("Drag iniciado");
}
});
//Movendo o mouse
canvas.addEventListener("mousemove", (e) => {
  if(!dragging) return; //Se não estiver arrastando, sai da função
  const rect = canvas.getBoundingClientRect(); //Obtem o tamanho visivel do canvas na tela
  const scaleX = canvas.width / rect.width; //Calcula fator de escala horizontal entre tela e canvas real
  const scaleY = canvas.height / rect.height; //Calcula fator de escala vertical entre tela e canvas real
  overlayX = ((e.clientX - rect.left) * scaleX) - dragOffsetX; //Atualiza a posição X do overlay
  overlayY = ((e.clientY - rect.top) * scaleY) - dragOffsetY; //Atualiza a posição Y do overlay
  overlayPercentX = overlayX / canvas.width; //Converte posição horizontal para porcentagem
  overlayPercentY = overlayY / canvas.height; //Converte posição vertical para porcentagem
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
});

canvas.addEventListener("mouseleave", () =>{
  dragging = false;
});

// =======================================
// CARREGA FFMPEG APENAS UMA VEZ
// =======================================
const ffmpeg = new FFmpeg(); //Instancia principal do FFmpeg
let ffmpegLoaded = false; //Controle para saber se já carregou
async function loadFFmpeg(){ 
  if(ffmpegLoaded) return; //Se já carregou anteriormente...
  console.log("Carregando FFmpeg...");
  await ffmpeg.load(); //Faz download dos arquivos internos: https://app.unpkg.com/@ffmpeg/core@0.11.0/files/dist
  ffmpegLoaded = true;
  console.log("FFmpeg carregado com sucesso.");
}

//CÁLCULO DE TEMPO DOS PROCESSOS
const startTime = Date.now(); //Tempo atual
function formatElapsedTime(startTime){
  const elapsedMs = Date.now() - startTime;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// =======================================
// EXPORTAÇÃO MP3 + MP4
// =======================================
btExportar.addEventListener("click", exportVideo);
async function exportVideo(){
  if(!audioFile){
    alert("Selecione o arquivo MP3!");
    return;
  }
  if(!videoFile){
    alert("Selecione o arquivo MP4!");
    return;
  }

  await loadFFmpeg(); //Garante que o FFmpeg seja carregado

  audio.src = URL.createObjectURL(audioFile); //Cria URL temporaria para o audio MP3
  await new Promise(resolve => { //Aguarda carregamento do audio MP3
    audio.onloadedmetadata = resolve;
  });
  const audioDuration = Math.floor(audio.duration); //Duração total do MP3 em segundos
  const last20seconds = audioDuration - 20; //Momento em que o overlay deve aparecer
  console.log("Duração MP3: ", audioDuration);
  console.log("Ultimos 20 segundos começa em: ", last20seconds);

  //ARQUIVO MP3 - Envia o MP3 para a memória do FFmpeg
  await ffmpeg.writeFile(
    "audio.mp3",
    new Uint8Array(await audioFile.arrayBuffer())
  );
  console.log("MP3 enviado para o FFmpeg.");
  console.log(`Tempo total: ${formatElapsedTime(startTime)}`);
  //ARQUIVO MP4 - Envia o MP4 para a memória do FFmpeg
  await ffmpeg.writeFile(
    "video.mp4",
    new Uint8Array(await videoFile.arrayBuffer())
  );
  console.log("MP4 enviado para o FFmpeg.");
  console.log(`Tempo total: ${formatElapsedTime(startTime)}`);
  //ARQUIVO OVERLAY - Envia o arquivo inscreva-se para a memória do FFmpeg
  const overlayResponse = await fetch(overlayPath); //Carrega arquivo overlay da pasta raiz
  console.log("Status overlay: ", overlayResponse.status);
  const overlayBuffer = await overlayResponse.arrayBuffer(); //Converte o arquivo para ArrayBuffer
  console.log("Overlay carregado: ", overlayBuffer.byteLength);
  const overlayUint8 = new Uint8Array(overlayBuffer); //Converte o arquivo para ArrayBuffer
  await ffmpeg.writeFile("overlay.mp4", overlayUint8); //Envia overlay para memória do FFmpeg
  console.log("Overlay enviado para o FFmpeg.");
  console.log(`Tempo total: ${formatElapsedTime(startTime)}`);
  const scale = parseFloat(overlayInput.value);
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const exportX = Math.floor(overlayPercentX * videoWidth);
  const exportY = Math.floor(overlayPercentY * videoHeight);
  console.log("Video Width:", videoWidth);
  console.log("Video Height:", videoHeight);
  console.log("Export X: ", exportX); //Exibe coordenadas finais X
  console.log("Export Y: ", exportY); //Exibe coordenadas finais Y

  //LOOP REVERSO DO VIDEO PRINCIPAL
  const selectedLoop = loopMode.value;
  let sourceVideo = "video.mp4";
  if(selectedLoop === "reverse"){
    console.log("Criando vídeo PingPong...");
    await ffmpeg.exec([ //Exportação do vídeo temporário para fazer reverso
      "-i", "video.mp4",
      "-filter_complex",
      "[0:v]reverse[rev];[0:v][rev]concat=n=2:v=1:a=0[v]",
      "-map", "[v]",
      "-an",      
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "18",
      "pingpong.mp4"
    ]);
    sourceVideo = "pingpong.mp4";
    console.log("Vídeo PingPong criado.");
    console.log(`Tempo total: ${formatElapsedTime(startTime)}`);
  }
  // Filtro principal
  const filterComplex = `
    [1:v]
    chromakey=0x00FF00:0.25:0.08,
    scale=iw*${scale}:ih*${scale}[ov];
    [0:v][ov]
    overlay=${exportX}:${exportY}:
    enable='between(t,0,8)'
    [v];
    [2:a][1:a]
    amix=inputs=2:duration=first[aout]
  `;

  //FFMPEG - COMANDOS PARA PROCESSAR OS ARQUIVOS:
  try{
    await ffmpeg.exec([
        "-stream_loop", "-1",      //Faz o video repetir infinitamente
        "-i", sourceVideo,         //Identifica o arquivo de video principal
        "-i", "overlay.mp4",       //Identifica o arquivo de video overlay
        "-i", "audio.mp3",         //Identifica o arquivo de audio
        "-filter_complex", filterComplex, //Sobrepoe o video principal + overlay
                                   //1 = overlay | 0 = video principal
                                   //Primeiro está retirando o chroma key, redimencionando o overlay, depois posiciona no centro
                                   //chromakey=COR:SIMILARIDADE:SUAVIZAÇÃO 
                                     //COR => R=00|G=FF|B=00 --> Verde Puro
                                     //SIMILARIDADE => 0.10(Remove pouco verde)... 0.40(Remove quase tudo)
                                     //SUAVIZAÇÃO => Suavização da borda, evita efeito serrilhado
                                   //scale=iw*2:ih*2 -->   
                                   //W = largura video principal / w = largura overlay / H = altura video principal / h = altura overlay
        "-map", "[v]",             //Usa video filtrado
        "-map", "[aout]",          //Unir audio do MP3 com o audio do video do overlay        
        "-c:v", "libx264",         //Mantem o arquivo original - libx264: Permite editar o video
        "-preset", "superfast",     //Compressão do arquivo: ultrafast, superfast, veryfast, faster, fast, medium (padrão)...
        "-crf", "20",              //Qualidade do video
        "-c:a", "aac",             //Converte audio em AAC
        "-t", `${audioDuration}`,  //Termina exatamente ao tamanho do MP3
        "saida.mp4"                //Arquivo gerado
    ]);
    /*
    COMPRESSÃO:
    Preset	   Velocidade	          Qualidade por tamanho
    ultrafast  ⭐⭐⭐⭐⭐⭐⭐⭐	❌ pior compressão
    superfast  ⭐⭐⭐⭐⭐⭐⭐	  ❌
    veryfast   ⭐⭐⭐⭐⭐⭐	     ⚠️
    faster	   ⭐⭐⭐⭐⭐        ✅
    fast	     ⭐⭐⭐⭐           ✅
    medium	   ⭐⭐⭐             ⭐ padrão
    slow	     ⭐⭐                ⭐⭐⭐
    slower	   ⭐                  ⭐⭐⭐⭐

    QUALIDADE:
    CRF 10 = Insano
    CRF 18 = Quase original (praticamente sem perda visual)
    CRF 20 = Excelente
    CRF 23 = Muito boa (padrão x264)
    CRF 25 = Boa
    CRF 28 = Média
    CRF 32 = Ruim

    O que acontece na prática: Imagine um vídeo final de 10 minutos em 720p.
    ultrafast + CRF 23
      Exporta em:20~40 segundos
      Arquivo:250 MB
      Qualidade: Média (Pode aparecer blocos e "craquelados")

    veryfast + CRF 23
      Exporta em:40~90 segundos
      Arquivo:180 MB
      Qualidade:Boa

    faster + CRF 20
      Exporta em:1~2 minutos
      Arquivo:140 MB
      Qualidade:Muito boa

    medium + CRF 18
      Exporta em:2~5 minutos
      Arquivo:100 MB
      Qualidade:Excelente
    */
    console.log(`Tempo total MP4 gerado pelo FFMPEG: ${formatElapsedTime(startTime)}`);
  }catch(error){
    console.log("ERRO FFMPEG: ", error);
  }

  console.log("Tentando ler saida .MP4");
  const files = await ffmpeg.listDir("/");
  console.log(files);

  const data = await ffmpeg.readFile("saida.mp4"); //Lê arquivo final gerado
  const blob = new Blob( //Criar blob para download em formato MP4
      [data],{type: "video/mp4"}
  );
  const url = URL.createObjectURL(blob); //Gera o link temporário
  const a = document.createElement("a"); //Cria elemento de link invisível na página
  a.href = url; //Define que o elemento recebe o objeto criado pelo blob
  a.download = "video-final.mp4"; //Cria opção para realiza o download do link
  a.click(); //Clicando no link para iniciar o download
  URL.revokeObjectURL(url); //Limpa a memória
  console.log("Download iniciado.");
  console.log(`Tempo total: ${formatElapsedTime(startTime)}`);
}

function drawPreview(){
  requestAnimationFrame(drawPreview);
  if(video.readyState < 2) return;
  if(loopMode.value === "reverse"){
    video.pause();
    video.currentTime += (1 / 30) * reverseDirection;
    if(video.currentTime >= video.duration){
      reverseDirection = -1;
    }
    if(video.currentTime <= 0){
      reverseDirection = 1;
    }
  }else{
    if(video.paused){
      video.play();
    }
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //Chroma key no canvas
  if(overlayVideo.readyState >= 2){
    overlayWidth = overlayVideo.videoWidth * overlayScale; //Calcula o overlay em largura de acordo com o slider
    overlayHeight = overlayVideo.videoHeight * overlayScale; //Calcula o overlay em altura de acordo com o slider
    overlayPercentX = overlayX / canvas.width; //Posição relativa horizontal sempre atualizada
    overlayPercentY = overlayY / canvas.height; //Posição relativa vertical sempre atualizada
    if( //Faz o canva interno ser exatamente o mesmo tamanho do overlay
    chromaCanvas.width !== overlayVideo.videoWidth ||
    chromaCanvas.height !== overlayVideo.videoHeight
    ){
      chromaCanvas.width = overlayVideo.videoWidth;
      chromaCanvas.height = overlayVideo.videoHeight;
    }   
    chromaCtx.drawImage(overlayVideo, 0, 0); //Desenha o frame atual do vídeo overlay dentro do canva temporario
    //Capturando todos os pixels e aplicando o chromakey:
    const frame = chromaCtx.getImageData(0, 0, chromaCanvas.width, chromaCanvas.height); 
    const pixels = frame.data;
    for(let i = 0; i < pixels.length; i += 4){
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if(g > 140 &&
         g > r * 1.3 &&
         g > b * 1.3
      ){
        pixels[i + 3] = 0;
      }
    }
    chromaCtx.putImageData(frame,0,0);
    ctx.drawImage(chromaCanvas, overlayX, overlayY, overlayWidth, overlayHeight);
  }
}

async function init(){
  console.log("Projeto carregado com sucesso");
  drawPreview();
}
init();