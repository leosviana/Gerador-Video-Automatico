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

// =======================================
// OVERLAY (SE INSCREVA)
// =======================================
const overlayPath = overlayFile; //Caminho do overlay
//const overlayVideo = document.createElement("video"); //Cria um video invisivel para o overlay
//video.preload = "auto";
//overlayVideo.preload = "auto";
//overlayVideo.muted = false; //Sem audio
//overlayVideo.loop = false; //Repetir continuamente
//overlayVideo.playsInline = true; //Necessario para autoplay em alguns navegadores
//let firstOverlayPlayed = false; //Controle para saber se o primeiro overlay foi executado
//let lastOverlayPlayed = false; //Controle para saber se o segundo overlay foi executado

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
  console.log("Iniciando exportação...");

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
  //ARQUIVO MP4 - Envia o MP4 para a memória do FFmpeg
  await ffmpeg.writeFile(
    "video.mp4",
    new Uint8Array(await videoFile.arrayBuffer())
  );
  console.log("MP4 enviado para o FFmpeg.");
  //ARQUIVO OVERLAY - Envia o arquivo inscreva-se para a memória do FFmpeg
  const overlayResponse = await fetch(overlayPath); //Carrega arquivo overlay da pasta raiz
  console.log("Status overlay: ", overlayResponse.status);
  const overlayBuffer = await overlayResponse.arrayBuffer(); //Converte o arquivo para ArrayBuffer
  console.log("Overlay carregado: ", overlayBuffer.byteLength);
  const overlayUint8 = new Uint8Array(overlayBuffer); //Converte o arquivo para ArrayBuffer
  await ffmpeg.writeFile("overlay.mp4", overlayUint8); //Envia overlay para memória do FFmpeg
  console.log("Overlay enviado para o FFmpeg.");
  const scale = parseFloat(
    overlayInput.value
);

  //FFMPEG - COMANDOS PARA PROCESSAR OS ARQUIVOS:
  try{
    await ffmpeg.exec([
        "-stream_loop", "-1",      //Faz o video repetir infinitamente
        "-i", "video.mp4",         //Identifica os arquivos
        "-i", "overlay.mp4",       //Identifica os arquivos
        "-i", "overlay.mp4",       //Identifica os arquivos
        "-i", "audio.mp3",         //Identifica os arquivos
        "-filter_complex",         //Sobrepoe o video principal + overlay
        `[1:v]
        chromakey=0x00FF00:0.25:0.08,
        scale=iw*${scale}:ih*${scale}[ov1];

        [2:v]
        chromakey=0x00FF00:0.25:0.08,
        scale=iw*${scale}:ih*${scale}[ov2];

        [0:v][ov1]
        overlay=(W-w)/2:(H-h)/2:
        enable='between(t,0,8)'
        [tmp];

        [tmp][ov2]
        overlay=(W-w)/2:(H-h)/2:
        enable='between(t,${last20seconds},${audioDuration})'
        [v]`,
             //1 = overlay | 0 = video principal
             //Primeiro está retirando o chroma key, redimencionando o overlay, depois posiciona no centro
             //chromakey=COR:SIMILARIDADE:SUAVIZAÇÃO 
                //COR => R=00|G=FF|B=00 --> Verde Puro
                //SIMILARIDADE => 0.10(Remove pouco verde)... 0.40(Remove quase tudo)
                //SUAVIZAÇÃO => Suavização da borda, evita efeito serrilhado
             //scale=iw*2:ih*2 -->   
             //W = largura video principal / w = largura overlay / H = altura video principal / h = altura overlay
        "-map", "[v]",             //Usa video filtrado
        "-map", "2:a",             //Usa audio do MP3
        "-c:v", "libx264",         //Mantem o arquivo original - libx264: Permite editar o video
        "-preset", "ultrafast",    //Exportação muito mais rápida
        "-crf", "18",              //Mantem qualidade excelente
        "-c:a", "aac",             //Converte audio em AAC
        "-t", `${audioDuration}`,  //Termina exatamente ao tamanho do MP3
        "saida.mp4"                //Arquivo gerado
    ]);
    console.log("MP4 gerado pelo FFMPEG.");
  }catch(error){
    console.log("ERRO FFMPEG: ", error);
  }

  console.log("Tentandoler ler saida .MP4");
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


}

async function init(){
  console.log("Projeto carregado com sucesso");
}
init();
