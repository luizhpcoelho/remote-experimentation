const fs = require('fs');
const express = require('express');
const cmd = require('node-cmd');
const Avrgirl = require('avrgirl-arduino');
const { stringify } = require('querystring');
const cors = require('cors');

const app = express();

const ip = "localhost";
var link_video;

console.clear();

var avrgirl = new Avrgirl({
  board: 'uno',
  manualReset: false,
  //port: '/dev/ttyACM0'
  port: '/dev/ttyUSB0'

});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('IP do host:', ip => {
  io_link = 'http://' + ip + ':3000/';
  
  console.log(`Entre em ${ip}:3000`);

  readline.question('IP do streaming de vídeo:', video => {
    //link_video = 'http://' + video + '/video';
    
    console.log(`Câmera em: ${link_video}`);

    readline.close();

    var server = require('http').createServer(app);
    
    app.use(express.static(__dirname)); 
    
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,DELETE, PUT');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        
        app.use(cors());

        if ( 'OPTIONS' == req.method ) {
          res.sendStatus(200);
        }
        else {
          next();
        }
    });
    
    app.get('/', function(req, res,next) {  
        res.header("Content-Type",'application/javascript');
        res.sendFile(__dirname + '/index.html');
    });
    
    server.listen(3000,ip);

    const io = require('socket.io')(server,{
        cors: {
            origin: true,
            methods: ["GET", "POST"]
        }
    });    
    
    io.on('connection', socket => {

      console.log("connect");

      //socket.emit('IP',link_video);
      
      
      socket.on('codigo', (arg1) => {
        
        console.log('Chegou');
        
        socket.emit('estagio', 'Entregue');
        
        console.log(arg1);
        
        fs.writeFile('main.c', arg1.texto, (err)=>{
          socket.emit('Erro', err)
        });

        cmd.run('avr-gcc -Wall -g -Os -mmcu=atmega32u4 -o main.bin main.c', (err, data, stderr) =>{
          if(err){
            console.log(err);
            socket.emit('compilation_rel', err);
          }
          else{
            socket.emit('estagio', 'Compilado');

            cmd.run('avr-size -C main.bin', (err,data) =>{
              console.log(data);
              socket.emit('compilation_rel', data)
            })

            cmd.run('avr-objcopy -j .text -j .data -O ihex main.bin main.hex', (err)=>{
              if(err){
                console.log(err);
              }
              else{
                avrgirl.flash('main.hex',(err) =>{
                  if(err){
                    console.log(err);
                    socket.emit('estagio', 'Erro ao carregar código no Arduino')
                    socket.emit('compilation_rel', err);
                  }
                  else{
                    socket.emit('estagio' , 'Upload código feito com sucesso!');
                  }
                });
              }
            });
          }
        });
      });
    });
  })
});


const path = require('path');

app.get('/', (req, res) => {
  res.sendFile( path.join(__dirname, 'index.html') );
});

setInterval( () => {
  io.emit('stream', 'algum dado');
}, 1000)

server.listen(3000);