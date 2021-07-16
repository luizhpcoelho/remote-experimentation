const socket = io('localhost:3000');
const editor = document.getElementById("codigo");
const relatorio = document.getElementById("relatorio");
const btn_compilador = document.getElementById("Carregar");
//const cmd = require('node-cmd');

btn_compilador.onclick = () => {
  const texto = ide.getValue();
  console.log(texto);
  estagio.innerText = "Enviando.";
  socket.emit("codigo", { texto });
};

const btn_salvar = document.getElementById("Salvar");

btn_salvar.onclick = () => {
  var codigo = ide.getValue();
  var data = new Blob([codigo], { type: "text/plain" });

  var url = window.URL.createObjectURL(data);
  console.log(data);
  document.getElementById("download").href = url;
};

socket.on("connect", () => {
  console.log("Conectado");
});

socket.on('stream', (data) => {
  console.log('data ', data);
});

socket.on("IP", (arg1) => {
  console.log(arg1);
  
  if ( arg1 ) {
    document.getElementById("stream").src = arg1;
    console.log("link IP executado");
  }
  else {
    console.log("Sem imagem por enquanto");
  }
  
});

socket.on("estagio", (arg1) => {
  estagio.innerText = arg1;
});

socket.on('compilation_rel', (arg1) => {
  console.log(arg1);
  relatorio.innerText = arg1; 

});
