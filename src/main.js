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
const previewContainer = document.querySelector(".preview-container");
const canvas = document.getElementById("previewCanvas"); //Canvas onde sera exibido o preview
const ctx = canvas.getContext("2d"); // Contexto 2D do canvas para desenhar imagens e videos
const loopMode = document.getElementById("loopMode"); //Seleciona o modo de repeticao
let dragging = false; //Controle de arrastar o mouse
let dragOffsetX = 0; //Posição X (vertical)
let dragOffsetY = 0; //Posição Y (horizontal)
const videoResolution = document.getElementById("videoResolution");
//CHROMAKEY - CANVA DE VIDEO OVERLAY(INSCREVA-SE):
const overlayInput = document.getElementById("overlayScale"); //Escala inicial do overlay
//TEXTO PERSONALIZADO
const customText = document.getElementById("customText");
const fontFamily = document.getElementById("fontFamily");
const fontSize = document.getElementById("fontSize");
const textColor = document.getElementById("textColor");
const strokeWidth = document.getElementById("strokeWidth");
const strokeColor = document.getElementById("strokeColor");
let textX = 100; //Posição X inicial
let textY = 100; //Posição Y inicial
let draggingText = false; //Controle de arrastar o mouse
let textOffsetX = 0; //Posição X (vertical)
let textOffsetY = 0; //Posição Y (horizontal)
//BOTOES (EXPORTAR / CANCELAR)
const outputResolution = document.getElementById("outputResolution");
const btExportar = document.getElementById("btExportar");
const btCancelar = document.getElementById("btCancelar");
let exportCancelled = true; //Controle de cancelamento
let exporting = false; //Controle de exportação iniciado como falso
//BARRA DE PROGRESSO
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressContainer = document.querySelector(".progress-container");
let showProgress = false; //Barra não será carregada antes de gerar o loop

//CONTROLE DE EXIBIÇÃO DOS BOTOES
function updateButtons(){
  btExportar.disabled = !(audioFile && videoFile); //Botão exportar só habilita quando tiver MP3 e MP4 selecionado
  btCancelar.disabled = !exporting; //Cancelar só habilita durante a exportação
}
updateButtons(); //Executa a função de exibir os botões

// =======================================
// AUDIO PRINCIPAL
// =======================================
const audio = document.createElement("audio"); //Cria o elemento de audio invisivel
audio.loop = false; //Remove o loop
//Captura o MP3 selecionado
audioInput.addEventListener("change", (event) => {
    audioFile = event.target.files?.[0] || null; //Salva o arquivo MP3 selecionado pelo usuário
    console.log("Audio carregado:", audioFile);
    updateButtons(); //Executa a função de exibir os botões
});

// =======================================
// VIDEO PRINCIPAL
// =======================================
const video = document.createElement("video"); //Cria um elemento de video invisivel
video.muted = true; //Remove audio do preview
video.loop = true; //Faz o video repetir infinitamente
//Captura o MP4 selecionado
videoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0]; //Salva o arquivo MP4 selecionado pelo usuário
  if(!file){ //Arquivo selecionado é diferente do selecionado anteriormente...
    console.log("Seleção de vídeo cancelada.");
    return;
  }
  videoFile = file; //Só atualiza a variável se realmente confirmou a escolha do vídeo
  updateButtons(); //Executa a função de exibir os botões
  let currentVideoUrl = null;
  if(currentVideoUrl){
    URL.revokeObjectURL(currentVideoUrl); //Limpa a memória (blob) do vídeo selecionado anteriormente
  }
  currentVideoUrl = URL.createObjectURL(videoFile); //Cria a URL temporária do video
  console.log("Video carregado:", videoFile);
  video.src = currentVideoUrl;

  video.onloadedmetadata = () => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = video.videoWidth; //Define resolucao de largura do canvas
    canvas.height = video.videoHeight; //Define resolucao de altura do canvas
    overlayWidth = overlayVideo.videoWidth * overlayScale;
    overlayHeight = overlayVideo.videoHeight * overlayScale;
    overlayX = (canvas.width - overlayWidth) / 2; //Centraliza o overlay em largura no preview
    overlayY = (canvas.height - overlayHeight) / 2; //Centraliza o overlay em altura no preview
    //previewContainer.style.width = video.videoWidth + "px";
    //previewContainer.style.height = video.videoHeight + "px";
    let label = `${width}x${height}`;
    if(height <= 240){
      label += " (240p)";
    }
    else if(height <= 360){
      label += " (360p)";
    }
    else if(height <= 480){
      label += " (480p - SD)";
    }
    else if(height <= 720){
      label += " (720p - HD)";
    }
    else if(height <= 1080){
      label += " (1080p - Full HD)";
    }
    else if(height <= 1440){
      label += " (1440p - 2K)"
    }
    else{
      label += " (4K+)";
    }
    videoResolution.textContent = `Resolução do vídeo: ${label}`;
    console.log("Resolução detectada: ", label);
    console.log(
      "Canvas:",
      canvas.width,
      canvas.height
    );

    console.log(
      "Video:",
      video.videoWidth,
      video.videoHeight
    );
  };
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
let overlayScale = parseFloat(overlayInput.value); //Escala overlay (slider)
let overlayX = 400; //Posição horizontal em pixel do canvas
let overlayY = 150; //Posição vertical em pixel do canvas
let overlayPercentX = 0; //Posição relativa (0 e 1). Será usada na exportação para manter a mesma posição
let overlayPercentY = 0; //Posição relativa (0 e 1). Será usada na exportação para manter a mesma posição
let overlayWidth = 0; //Tamanho atual do overlay
let overlayHeight = 0; //Tamanho atual do overlay
overlayInput.addEventListener("input", () => {
  overlayScale = parseFloat(overlayInput.value); //Atualiza a escala selecionada no slider
  //Guarda o centro atual do overlay:
  const centerX = overlayX + overlayWidth / 2;
  const centerY = overlayY + overlayHeight / 2;
  //Recalcula o tamanho do overlay:
  overlayWidth = overlayVideo.videoWidth * overlayScale;
  overlayHeight = overlayVideo.videoHeight * overlayScale;
  //Mantem o overlay centralizado no mesmo ponto:
  overlayX = centerX - overlayWidth / 2;
  overlayY = centerY - overlayHeight / 2;
});

//Arrastar overlay com o mouse
canvas.addEventListener("mousedown", (e) =>{
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  //Arrastar o texto no canva
  ctx.font = `${fontSize.value}px ${fontFamily.value}`;
  const textWidth = ctx.measureText(customText.value).width;
  const textHeight = parseInt(fontSize.value);
  if(
      mouseX >= textX &&
      mouseX <= textX + textWidth &&
      mouseY >= textY - textHeight &&
      mouseY <= textY
  ){
      draggingText = true;
      textOffsetX = mouseX - textX;
      textOffsetY = mouseY - textY;
      return;
  }

  //Arrastar o overlay no canva 
  if( //Verifica se clicou dentro do overlay
    mouseX >= overlayX &&
    mouseX <= overlayX + overlayWidth &&
    mouseY >= overlayY &&
    mouseY <= overlayY + overlayHeight
  ){
    dragging = true;
    dragOffsetX = mouseX - overlayX;
    dragOffsetY = mouseY - overlayY;
    draggingText = false; //Impede de mover o texto junto
    //console.log("Drag iniciado");
  }


});
//Movendo o mouse
canvas.addEventListener("mousemove", (e) => {
  //if(!dragging) return; //Se não estiver arrastando, sai da função
  const rect = canvas.getBoundingClientRect(); //Obtem o tamanho visivel do canvas na tela
  const scaleX = canvas.width / rect.width; //Calcula fator de escala horizontal entre tela e canvas real
  const scaleY = canvas.height / rect.height; //Calcula fator de escala vertical entre tela e canvas real
  
  //Movimentando o texto
  if(draggingText){
    //const rect = canvas.getBoundingClientRect();
    //const scaleX = canvas.width / rect.width;
    //const scaleY = canvas.height / rect.height;
    textX = ((e.clientX - rect.left) * scaleX) - textOffsetX;
    textY = ((e.clientY - rect.top) * scaleY) - textOffsetY;
    return; //Nõ move o overlay
  }

  //Movimentando o overlay
  if(dragging){
    //const rect = canvas.getBoundingClientRect();
    overlayX = ((e.clientX - rect.left) * scaleX) - dragOffsetX; //Atualiza a posição X do overlay
    overlayY = ((e.clientY - rect.top) * scaleY) - dragOffsetY; //Atualiza a posição Y do overlay
    overlayPercentX = overlayX / canvas.width; //Converte posição horizontal para porcentagem
    overlayPercentY = overlayY / canvas.height; //Converte posição vertical para porcentagem
  }
});

canvas.addEventListener("mouseup", () => {
  dragging = false;
  draggingText = false;
});

canvas.addEventListener("mouseleave", () =>{
  dragging = false;
  draggingText = false;
});

// =======================================
// CARREGA FFMPEG APENAS UMA VEZ
// =======================================
let ffmpeg = new FFmpeg(); //Instancia principal do FFmpeg
/*ffmpeg.on("log", ({message}) => {
  console.log("FFMPEG: ", message);
})*/
let ffmpegLoaded = false; //Controle para saber se já carregou
video.pause();
overlayVideo.pause();
async function loadFFmpeg(){ 
  if(ffmpegLoaded) return; //Se já carregou anteriormente...
  //console.log("Carregando FFmpeg...");
  await ffmpeg.load(); //Faz download dos arquivos internos: https://app.unpkg.com/@ffmpeg/core@0.11.0/files/dist
  ffmpegLoaded = true;
  console.log("FFmpeg carregado com sucesso.");
}

//CÁLCULO DE TEMPO DOS PROCESSOS
function formatElapsedTime(startTime){
  const elapsedMs = Date.now() - startTime;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

//INICIO DA BARRA DE PROGRESSO
ffmpeg.on("progress", ({progress}) => {
  if(!showProgress){
    return;
  }
  const percent = Math.min(100, Math.max(0, Math.floor(progress * 100)));
  progressFill.style.width = percent + "%";
  progressText.textContent = percent + "%";
});

//CRIA IMAGEM PNG DO TEXTO
function createTextOverlayImage(exportWidth, exportHeight){

  // Cria canvas transparente na resolução FINAL do vídeo
  const textCanvas = document.createElement("canvas");
  textCanvas.width = exportWidth;
  textCanvas.height = exportHeight;

  const textCtx = textCanvas.getContext("2d");

  // Calcula proporção entre preview e exportação
  const scaleX = exportWidth / canvas.width;
  const scaleY = exportHeight / canvas.height;

  // Ajusta posição proporcionalmente
  const exportTextX = textX * scaleX;
  const exportTextY = textY * scaleY;

  // Ajusta tamanho da fonte proporcionalmente
  const exportFontSize = parseInt(fontSize.value) * scaleY;

  textCtx.font = `${exportFontSize}px ${fontFamily.value}`;

  // Borda
  textCtx.lineWidth =
    parseInt(strokeWidth.value) * scaleY;

  textCtx.strokeStyle = strokeColor.value;

  // Cor do texto
  textCtx.fillStyle = textColor.value;

  // Desenha borda
  textCtx.strokeText(
    customText.value,
    exportTextX,
    exportTextY
  );

  // Desenha texto
  textCtx.fillText(
    customText.value,
    exportTextX,
    exportTextY
  );

  return textCanvas.toDataURL("image/png");
}

// =======================================
// EXPORTAÇÃO MP3 + MP4
// =======================================
btExportar.addEventListener("click", exportVideo);
async function exportVideo(){
  const startTime = Date.now(); //Tempo atual
  exportCancelled = false; //Iniciar cancelamento como falso
  exporting = true; //Controle de exportação iniciado como verdadeiro
  progressContainer.style.display = "block"; //Exibir barra de progresso
  updateButtons(); //Executa a função de exibir os botões
  showProgress = false;
  progressFill.style.width = "0%"; //Iniciar estilo na barra de download com tamanho de 0%
  progressText.textContent = "0%"; //Iniciar texto na barra de download com 0%

  if(!audioFile){
    alert("Selecione o arquivo MP3!");
    return;
  }
  if(!videoFile){
    alert("Selecione o arquivo MP4!");
    return;
  }

  await loadFFmpeg(); //Garante que o FFmpeg seja carregado
  if(exportCancelled) return;

  audio.src = URL.createObjectURL(audioFile); //Cria URL temporaria para o audio MP3
  await new Promise(resolve => { //Aguarda carregamento do audio MP3
    audio.onloadedmetadata = resolve;
  });
  const audioDuration = Math.floor(audio.duration); //Duração total do MP3 em segundos
  console.log("Duração MP3: ", audioDuration);

  //ARQUIVO MP3 - Envia o MP3 para a memória do FFmpeg
  await ffmpeg.writeFile(
    "audio.mp3",
    new Uint8Array(await audioFile.arrayBuffer())
  );
  console.log("MP3 enviado para o FFmpeg.");

  //console.log("Nome: ", videoFile.name);
  //console.log("Tamanho: ", videoFile.size);
  //console.log("Tipo: ", videoFile.type);
  
  //ARQUIVO MP4 - Envia o MP4 para a memória do FFmpeg
  try{
    const buffer = await videoFile.arrayBuffer();
    //console.log("Buffer OK: ", buffer.byteLength);
    await ffmpeg.writeFile(
      "video.mp4",
      new Uint8Array(await videoFile.arrayBuffer())
    );
    console.log("MP4 enviado para o FFmpeg.");
  }catch(error){
    console.log("Erro ao ler vídeo: ", error);
  }
  
  //ARQUIVO OVERLAY - Envia o arquivo inscreva-se para a memória do FFmpeg
  const overlayResponse = await fetch(overlayPath); //Carrega arquivo overlay da pasta raiz
  //console.log("Status overlay: ", overlayResponse.status);
  const overlayBuffer = await overlayResponse.arrayBuffer(); //Converte o arquivo para ArrayBuffer
  //console.log("Overlay carregado: ", overlayBuffer.byteLength);
  const overlayUint8 = new Uint8Array(overlayBuffer); //Converte o arquivo para ArrayBuffer
  await ffmpeg.writeFile("overlay.mp4", overlayUint8); //Envia overlay para memória do FFmpeg
  console.log("Overlay enviado para o FFmpeg.");

  //CRIA PNG DO TEXTO
  let exportWidth = video.videoWidth;
  let exportHeight = video.videoHeight;
  if(outputResolution.value !== "original"){
    const parts = outputResolution.value.split(":");
    exportWidth = parseInt(parts[0]);
    exportHeight = parseInt(parts[1]);
  }
  const textImageData = createTextOverlayImage(exportWidth, exportHeight); //Gera imagem PNG do texto
  const textBlob = await (await fetch(textImageData)).blob(); //Converte Base64 para Blob
  const textBuffer = await textBlob.arrayBuffer(); //Converte Blob para ArrayBuffer
  await ffmpeg.writeFile("text.png", new Uint8Array(textBuffer)); //Envia PNG para memória do FFmpeg
  console.log("Text PNG enviado para FFmpeg");

  const scale = parseFloat(overlayInput.value);
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  //Calcula o centro do overlay no preview:
  const centerX = overlayX + (overlayWidth / 2); //Centro X do overlay no canva
  const centerY = overlayY + (overlayHeight / 2); //Centro Y do overlay no canva
  const centerPercentX = centerX / canvas.width; //Converte o centro X para porcentagem
  const centerPercentY = centerY / canvas.height; //Converte o centro Y para porcentagem
  const exportX = Math.floor(overlayPercentX * videoWidth);
  const exportY = Math.floor(overlayPercentY * videoHeight);
  //console.log("Video Width:", videoWidth);
  //console.log("Video Height:", videoHeight);
  //console.log("Export X: ", exportX); //Exibe coordenadas finais X
  //console.log("Export Y: ", exportY); //Exibe coordenadas finais Y

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
  //Resolução saída
  let videoChain = `overlay=${exportX}:${exportY}`;
  if(outputResolution.value !== "original"){
    videoChain += `,scale=${outputResolution.value}`;
  }

  // Filtro principal
  const filterComplex =
    // Remove chromakey do overlay
    `[1:v]chromakey=0x00FF00:0.25:0.08,scale=iw*${scale}:ih*${scale}[ov];` +
    // Junta vídeo principal + overlay
    `[0:v][ov]${videoChain}[v1];` +
    // Adiciona texto sobre o vídeo já montado
    `[v1][3:v]overlay=0:0[v];` +
    // Mistura os áudios
    `[2:a][1:a]amix=inputs=2:duration=first[aout]`;

  //Ativa a barra de progresso novamente após gerar o loop
  showProgress = true;
  progressFill.style.width = "0%";
  progressText.textContent = "0%";

//console.log({overlayX, overlayY, overlayWidth, overlayHeight, exportX, exportY, scale});

  //FFMPEG - COMANDOS PARA PROCESSAR OS ARQUIVOS:
  try{
    await ffmpeg.exec([
        "-stream_loop", "-1",      //Faz o video repetir infinitamente
        "-i", sourceVideo,         //Identifica o arquivo de video principal
        "-i", "overlay.mp4",       //Identifica o arquivo de video overlay
        "-i", "audio.mp3",         //Identifica o arquivo de audio
        "-i", "text.png",          //Identifica o arquivo de PNG do texto
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
        "-preset", "ultrafast",     //Compressão do arquivo: ultrafast, superfast, veryfast, faster, fast, medium (padrão)...
        "-crf", "23",              //Qualidade do video
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
  }catch(error){
    if(exportCancelled){ //Exportação cancelada pelo usuário
      console.log("Download cancelado.");
      return;
    }
    console.error(error);
    try{
      const log = ffmpeg.on("log", ({message}) => {
        console.log(message);
      });
    }catch{}
  }

  //console.log("Tentando ler saida .MP4");
  //const files = await ffmpeg.listDir("/");
  //console.log(files);

  const data = await ffmpeg.readFile("saida.mp4"); //Lê arquivo final gerado
  const blob = new Blob( //Criar blob para download em formato MP4
      [data],{type: "video/mp4"}
  );
  const url = URL.createObjectURL(blob); //Gera o link temporário
  const a = document.createElement("a"); //Cria elemento de link invisível na página
  a.href = url; //Define que o elemento recebe o objeto criado pelo blob
  a.download = "video-final.mp4"; //Cria opção para realiza o download do link
  a.click(); //Clicando no link para iniciar o download
  setTimeout(() => { //Aguarda 10 segundos 
    URL.revokeObjectURL(url); //Limpa a memória (blob) do vídeo selecionado
  }, 10000);
  console.log("Download finalizado.");
  console.log(`Tempo de download: ${formatElapsedTime(startTime)}`);
  progressFill.style.width = "100%";
  progressText.textContent = "100%";
  setTimeout(() => {
    progressContainer.style.display = "none"; //Retirar barra de progresso após 15 segundos
  }, 5000);
  audioFile = null; //Limpa arquivo de audio da memoria
  videoFile = null; //Limpa arquivo de video da memoria
  audioInput.value = ""; //Limpa os campos HTML de audio
  videoInput.value = ""; //Limpa os campos HTML de video
  videoResolution.textContent = "Resolução do vídeo: Nenhum vídeo carregado";
  
  //Limpa video:
    video.pause(); //Pausa o video
    video.currentTime = 0; //Reseta renderização do vídeo do preview
    video.removeAttribute("src"); //Limpa o preview
    video.load();
  //Limpa o canvas:
    ctx.clearRect(0, 0, canvas.width, canvas.height); //Limpa completamente o canvas do preview
  //Reseta overlay:
    overlayWidth = 0; //Reseta tamanho do overlay de largura
    overlayHeight = 0; //Reseta tamanho do overlay de altura
    overlayX = 400; //Reseta posição X do overlay
    overlayY = 150; //Reseta posição Y do overlay
    exporting = false; //Controle de exportação iniciado como falso
    updateButtons(); //Executa a função de exibir os botões

  //console.log("Overlay Width:", overlayWidth);
  //console.log("Overlay Height:", overlayHeight);
  //console.log("Centro X:",overlayX + overlayWidth / 2);
  //console.log("Centro Canvas:", canvas.width / 2);
  //video.play(); //Quando terminar a exportacao pode iniciar o preview do video principal novamente
  //overlayVideo.play(); //Quando terminar a exportacao pode iniciar o preview do overlay novamente
}

//TELA DE PREVIEW
function drawPreview(){
  requestAnimationFrame(drawPreview);
  if(exporting){
    return;
  }
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

  //DESENHAR OVERLAY COM CHROMAKEY NO CANVAS
  if(overlayVideo.readyState >= 2){
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

  //DESENHAR TEXTO PERSONALIZADO NO CANVA
  ctx.font = `${fontSize.value}px ${fontFamily.value}`;
  ctx.lineWidth = parseInt(strokeWidth.value);
  ctx.strokeStyle = strokeColor.value;
  ctx.fillStyle = textColor.value;
  ctx.strokeText(customText.value, textX, textY);
  ctx.fillText(customText.value, textX, textY);
}

//console.log(overlayVideo.videoWidth, overlayVideo.videoHeight);

//Função para cancelar download
btCancelar.addEventListener("click", async () => {
  exportCancelled = true;
  exporting = false; //Controle de exportação iniciado como falso
  updateButtons(); //Executa a função de exibir os botões
  showProgress = false; //Barra não será carregada
  progressContainer.style.display = "none";
  progressFill.style.width = "0%";
  progressText.textContent = "0%";
  try{
    await ffmpeg.terminate(); //Interrompe o FFmpeg
    ffmpegLoaded = false;
    exporting = false;
    video.play(); //Quando cancelar exportação pode iniciar o preview do video principal novamente
    overlayVideo.play(); //Quando cancelar exportação pode iniciar o preview do overlay novamente
    progressFill.style.width = "0%";
    progressText.textContent = "Cancelado";
    alert("Download cancelado.");
  }
  catch(error){
    console.log(error);
  }
});

async function init(){
  console.log("Projeto carregado com sucesso");
  drawPreview();
}
init();

//TERMINAL - EXECUTAR PROJETO:
//npm run dev
//TERMINAL - COMPILAR NO GITHUB:
//npm run build
//TERMINAL - PUBLICAR NO GITHUB:
//npm run deploy