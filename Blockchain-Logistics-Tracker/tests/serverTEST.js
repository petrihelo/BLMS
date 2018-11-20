var express = require('express');
var app = express();
var port = 8080;
app.set('view engine', 'ejs')

app.listen(port, function() {
 console.log('app started');
});

app.get('/', function (req, res) {
  res.render('index');
})

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.post('/sendpacketid', function (req, res) {
  res.render('index');
  console.log(req.body.packetID);
})
