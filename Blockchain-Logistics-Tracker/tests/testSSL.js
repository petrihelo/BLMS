var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');


var privateKey  = fs.readFileSync('../ssl/private.key', 'utf8');
var certificate = fs.readFileSync('../ssl/certificate.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var app1 = express();
var app2 = express();

var httpServer = http.createServer(app1);
var httpsServer = https.createServer(credentials, app2);

httpServer.listen(8080);
httpsServer.listen(8443);

app2.get('/', function(req,res) {
  res.send('hello');
});

app1.get('/', function(req,res) {
  res.redirect('https://81.197.103.122:8443');
});


/*
var express = require('express');
//initializing and starting web server
var app = express();
var port = 8080;
app.set('view engine', 'ejs');
app.listen(port, function() {
console.log('Webserver running in port '+port);
//ethereumModule.connectEthereum();
});

app.get('/', function (req, res)
{
res.send('https works');
})
*/
