var express = require('express')(),
    https = require('https'),
    fs = require('fs'),
    WebSocket = require('ws'),
    args = process.argv.slice(2),
    ssl = {
        key: fs.readFileSync('/etc/letsencrypt/live/ie.dyndns.biz/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/ie.dyndns.biz/cert.pem')
    }
  
var server = https.createServer(ssl, express)
server.listen(443) //at HTTPS port, serve the express server

var wss = new WebSocket.Server({ server: server })
wss.on('connection', function connection(ws, req) {
    ws.on('message', function incoming(message) {
      console.log(message)
    })
})

function send_if_online(callback) {    //prevent_ws_further is a secret name that is given to a client only once!
  wss.clients.forEach(function each(client) {
      if(client.readyState === WebSocket.OPEN) callback(client)
  })
}

//html files served by the web server
express.get('/', function (req, res) { res.sendFile(__dirname + '/index.html') })
express.get('/parser2.js', function (req, res) { res.sendFile(__dirname + '/parser2.js') })
express.get('/smoothie.js', function (req, res) { res.sendFile(__dirname + '/smoothie.js') })

express.use(function (req, res, next) { res.status(404).send("404 Route does not exist, what you doing here?<br> Have a nice day ^_^") })


const Ganglion = require('./openBCIGanglion');
const k = require('openbci-utilities/dist/constants');
const verbose = true;
let ganglion = new Ganglion({ debug: false, verbose: verbose }, (error) => { if (error) { console.log(error); } else { if (verbose) { console.log('Ganglion initialize completed'); } } });
function errorFunc (err) { throw err; }
const accel = true;

ganglion.once(k.OBCIEmitterGanglionFound, (peripheral) => {
  ganglion.searchStop().catch(errorFunc);
  ganglion.on('sample', (sample) => { console.log(sample.sampleNumber); });
  ganglion.on('close', () => { console.log('close event'); });
  ganglion.on('accelerometer', (accelData) => { console.log('accelData', accelData); });
  ganglion.on('message', (data) => {
    send_if_online(function(ws) {
      ws.send(JSON.stringify([...data]))
    })

  });


  ganglion.once('ready', () => {
    if (accel) ganglion.accelStart().then(() => { return ganglion.streamStart(); }) .catch(errorFunc);
    else ganglion.streamStart().catch(errorFunc);
  });
  ganglion.connect(peripheral).catch(errorFunc);
});

function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    ganglion.manualDisconnect = true;
    ganglion.disconnect();
    ganglion.removeAllListeners('droppedPacket');
    ganglion.removeAllListeners('accelerometer');
    ganglion.removeAllListeners('sample');
    ganglion.removeAllListeners('message');
    ganglion.removeAllListeners('impedance');
    ganglion.removeAllListeners('close');
    ganglion.removeAllListeners('error');
    ganglion.removeAllListeners('ganglionFound');
    ganglion.removeAllListeners('ready');
    ganglion.destroyNoble();
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    if (ganglion.isSearching())
      ganglion.searchStop().catch(console.log);
    if (accel) ganglion.accelStop().catch(console.log);
    ganglion.manualDisconnect = true;
    ganglion.disconnect(true).catch(console.log);
    process.exit(0);
  }
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
