var debug = true;

//adding npm modules
var express = require('express');
var bodyParser = require('body-parser')
var NodeGeocoder = require('node-geocoder');
var https = require('https');
var fs = require('fs');
var path = require("path");
var qr = require('qrcode');

//adding external .js file
var ethereumModule = require('./ethereum/ethereumModule.js');
var cryptoModule = require('./crypto/cryptoModule.js');
var databaseModule = require('./db/databaseModule.js');
var jsonModule = require('./json/jsonModule.js');
var inputModule = require('./input/inputModule.js');


//initializing and starting web server
var app = express();
var appUnsecure = express();

//initializing location and setting to finnish
var geoOptions = {provider: 'google',language:'fi'};
var geocoder = NodeGeocoder(geoOptions);

var portUnsecure = 80;
var port = 443;
appUnsecure.set('view engine', 'ejs');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

var SSLprivateKey  = fs.readFileSync('./ssl/private.key', 'utf8');
var certificate = fs.readFileSync('./ssl/certificate.crt', 'utf8');
var credentials = {key: SSLprivateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);

appUnsecure.listen(portUnsecure, function()
{
  console.log('Webserver running in port '+portUnsecure);
  ethereumModule.connectEthereum();
});

httpsServer.listen(port);
console.log('SSL webserver running in port '+port);

//account
//NEVER STORE THE PRIVATE KEY IN PUBLISHED SOURCE CODE!!!!
var fromAccount = "0x15abD8B6b251Dac70B36C456BD880219080E153A";
var privateKey = "";
var cryptoPassword = "logistiikka";
//var txHash="";

app.locals.messageToClient="";
app.locals.suggestions="";
app.locals.retrievedPackets="";

//rendering html from ejs template and sending to client

//The simple GETs.
appUnsecure.get('/', function (req, res)
{
  res.redirect('https://blockchainlogistics.tk/');
})

app.get('/', function (req, res)
{
  //this is the "main menu"
  res.render('index');
})

app.get('/login', function (req, res)
{
  res.render('loginView');
})

app.get('/gen', function (req, res)
{
  var programFactor = fromAccount.substring(fromAccount.length-24,fromAccount.length);
  var runningNumber = ethereumModule.getNonce(fromAccount).toString();

  //adding zeros to the start
  while(runningNumber.length<8)
  {
    runningNumber = "0"+runningNumber;
  }

  var newID = programFactor + runningNumber;

  //writing QR code
  qr.toFile('./public/qrcodee.png', newID, {
    color: {
      dark: '#000000',  // Black
      light: '#0000' // Transparent
    }
  },
  function (err)
  {
    if (err) throw err
  });

  //res.send("Tracker factor: " + programFactor + " Nonce: " + runningNumber + " Generated Packet ID: " + newID);

  app.locals.programFactor=programFactor;
  app.locals.nonceFactor=runningNumber;
  app.locals.newID=newID;
  setTimeout(function(){res.render('newIDView');},300);

  if(debug)
  {
    console.log('QR code saved.');
    console.log("Generated new packet ID " + newID);
  }
});

//Less simple GETs with predictions and message reset
app.get('/add', function (req, res)
{
  var listExisting;
  var sendResponseLoop, checkIfBusyLoop;
  checkIfBusyLoop = setTimeout(function ()
  {
    if(databaseModule.isReserved()==false)
    {
      try
      {
        databaseModule.listPacketID();
        sendResponseLoop = setInterval(sendResponse,25);
        clearInterval(checkIfBusyLoop);
      }
      catch(error)
      {
        console.log(error);
      }
    }
  },500);
  function sendResponse()
  {
    listExisting = databaseModule.returnPacketList();
    if(listExisting!=null)
    {
      console.log("List of packets in database sent as predictive text input: "+listExisting);
      app.locals.suggestions=listExisting;
      res.render('addView');
      app.locals.messageToClient="";
      clearInterval(sendResponseLoop);
    }
  }
})

app.get('/search', function (req, res)
{
  var listExisting;
  var sendResponseLoop, checkIfBusyLoop;
  checkIfBusyLoop = setTimeout(function ()
  {
    if(databaseModule.isReserved()==false)
    {
      try
      {
        databaseModule.listPacketID();
        sendResponseLoop = setInterval(sendResponse,25);
        clearInterval(checkIfBusyLoop);
      }
      catch(error)
      {
        console.log(error);
      }
    }
  },500);
  function sendResponse()
  {
    listExisting = databaseModule.returnPacketList();
    if(listExisting!=null)
    {
      console.log("List of packets in database sent as predictive text input: "+listExisting);
      app.locals.suggestions=listExisting;
      res.render('searchView');
      app.locals.retrievedPackets="";
      clearInterval(sendResponseLoop);
    }
  }
});


//initializing body parser so we can fetch data from text box
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded());

//POST for HTTPS
app.post('/search', function (req, res)
{
  //saving searchTerm from client UI
  try
  {
    var searchTerm = inputModule.sanitizeInput(req.body.searchTerm);
  }
  catch(e)
  {
    console.log("Could not sanitize "+e);
  }

  //initializing strings to hold packet data
  var entriesFromDB;
  var stringFromEthereum;
  var decryptedStrings1 = "";
  var decryptedStrings2;
  var decryptedStringsFinal = "";

  //loops for async
  var searchEntriesLoop,checkIfMoreFromEthereumLoop,showResultsLoop;

  var busyCheckForPrintLoop = setInterval(function()
  {
    if(databaseModule.isReserved()==false)
    {
      //loading from DB
      try
      {
        databaseModule.loadFromDB(searchTerm);
        searchEntriesLoop = setInterval(searchEntries,25);
        //starting next loop
        clearInterval(busyCheckForPrintLoop);
      }
      catch (e)
      {
        console.log(e);
      }
    }
  },500);
  function searchEntries()
  {
    entriesFromDB = databaseModule.returnTXEntries();
    //when loaded from DB >> retrieving and decrypting the packet data
    if(entriesFromDB!=null)
    {
      entriesFromDB = entriesFromDB.split(',');
      var hashEntry;

      for(var i=0;i<entriesFromDB.length;i+=1)
      {
        hashEntry=entriesFromDB[i].split(':');

        if(hashEntry[0]!="" && hashEntry[1]!="" && hashEntry[0]!=null && hashEntry[1]!=null)
        {
          hashEntry[1]=hashEntry[1].replace("'","");
          hashEntry[1]=hashEntry[1].replace("'","");
          //hashEntry[1] is the transaction hash and here we search the transaction and the data stored to it
          var timestampTemp;
          try
          {
            timestampTemp = ethereumModule.getTimestamp(hashEntry[1],"string");
          }
          catch (e)
          {
            timestampTemp = "No timestamp yet. Please try again after 1 minute.";
          }
          try{
            stringFromEthereum = ethereumModule.getFromEthereum(hashEntry[1]);
            decryptedStrings1+=',"entry'+i+'":'+'{'+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' + timestampTemp +'", "txHash":"' +hashEntry[1]+'"}';
          }
          catch(e)
          {
            console.log("Retrieving data for TX "+hashEntry[1]+" was not succesful. \n"+e);
          }
          if(debug)
          {
            console.log(i+" searched tx "+hashEntry[1]);
          }
        }
      }
      checkIfMoreFromEthereumLoop = setInterval(checkIfMoreFromEthereum,25);
      clearInterval(searchEntriesLoop);
    }
  }
  function checkIfMoreFromEthereum()
  {
    if(decryptedStrings1!=decryptedStrings2)
    {
      decryptedStrings2=decryptedStrings1;
    }
    else
    {
      decryptedStringsFinal=decryptedStrings1;
      showResultsLoop = setInterval(showResults,25);
      clearInterval(checkIfMoreFromEthereumLoop);
    }
  }
  function showResults()
  {
    if(decryptedStringsFinal!="")
    {
      try
      {
        decryptedStringsFinal=decryptedStringsFinal.replace(',',"");
        var searchResult = '{"entries":{'+decryptedStringsFinal+'}}';
        var resultsJSON = JSON.parse(searchResult);
        if(debug)
          console.log(resultsJSON);
        app.locals.retrievedPackets=searchResult; //JSON.stringify(resultsJSON);
        res.redirect('/search');
        clearInterval(showResultsLoop);
      }
      catch (error)
      {
        console.log(error);
        res.send("Something went wrong. Probably the data is in wrong format.   "+error);
        clearInterval(showResultsLoop);
      }
    }
  }
});

app.post('/add', function (req, res)
{
  //no injection attacks here! sanitizing input
  //receiving input element values from users submission
  var packetIdFromClient=inputModule.sanitizeInput(req.body.packetID);
  var companyNameFromClient=inputModule.sanitizeInput(req.body.companyName);
  var longitude = inputModule.sanitizeInput(req.body.longitudeClient);
  var latitude = inputModule.sanitizeInput(req.body.latitudeClient);
  var userNameFromClient = inputModule.sanitizeInput(req.body.userName);

  //variables for the input data parameter
  var txCount,toAccount,activity
  var addressJSON = null;

  //strings of full packet data
  var dataToEncrypt;
  let encryptedDataToSave;

  //variables for the outputs to client
  var suggestionsInPost,messageToClient;

  //loops that have to be used for the async
  var checkIfReservedLoop, getCountAndActivityLoop, encryptAndSendEthereumLoop, refreshPageLoop;

  //starting the first loop
  checkIfReservedLoop = setInterval(function()
  {
    //If other clients dont have stored values on the way. We can begin the save.
    if(databaseModule.isReserved()==false)
    {
      //finding out existing entry count and company account assigned to the company
      databaseModule.checkCountForPacket(packetIdFromClient);
      toAccount = jsonModule.findCompanyAccount(companyNameFromClient.toUpperCase());

      //count is being retrieved from db, starting second loop to receive
      getCountAndActivityLoop = setInterval(getCountAndActivity,25);
      clearInterval(checkIfReservedLoop);
    }
    //long delay->less chance to conflict as it checks if the modules are busy only at the start
  },500);

  //The functions are in the same order here as the order they are executed in.

  function getCountAndActivity()
  {
    txCount = databaseModule.returnCount();

    //if none or even exist, we are receiving. if odd exists, we are already carrying the packet and giving it away next
    if(txCount>-1)
    {
      if(txCount==0||txCount % 2 == 0)
      {
        activity="receive";
        messageToClient="Packet "+packetIdFromClient+" RECEIVED.";
      }
      else
      {
        activity="deliver";
        messageToClient="Packet "+packetIdFromClient+" DELIVERED.";
      }

      //we have count and activity, time to get location
      getLocation();
      clearInterval(getCountAndActivityLoop);
    }
  }

  function getLocation()
  {
    //asynchronous retrieval of additional info based on gps coord, such as street address
    geocoder.reverse({lat:latitude,lon: longitude}, function(err, res)
    {
      //sometimes returns null! try catching
      try
      {
        addressJSON=JSON.stringify(res);
        addressJSON=addressJSON.replace("[","");
        addressJSON=addressJSON.replace("]","");
        //location info is being retrieved. Starting third loop.
        encryptAndSendEthereumLoop = setInterval(encryptAndSendEthereum,50);
      }

      catch(error)
      {
        getLocation();
        if(debug)
          console.log(error);
      }

      if(debug)
        console.log("Information of client: "+addressJSON);
    });
  }

  function encryptAndSendEthereum()
  {
    if(addressJSON!=null)
    {
      dataToEncrypt=inputModule.jsonifyString(packetIdFromClient,activity,userNameFromClient,companyNameFromClient,latitude,longitude,addressJSON);
      encryptedDataToSave = cryptoModule.encryptString(dataToEncrypt,cryptoPassword);

      ethereumModule.saveTransaction(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient);

      printDebugs();

      app.locals.messageToClient=messageToClient;
      res.redirect('/add');
      clearInterval(encryptAndSendEthereumLoop);
    }
  }

  function printDebugs()
  {
    if(debug)
    {
      console.log("Packet ID: " + packetIdFromClient);
      console.log("Company name: " + companyNameFromClient);
      console.log("Company account: " + toAccount);
      console.log("Existing TX count in DB for the packet: " + txCount);
      console.log("Current activity based on the count: " + activity);
      console.log("Data BEFORE encryption " + dataToEncrypt);
      console.log("Data AFTER encryption " + encryptedDataToSave);
    }
  }

})



//Debug GETs
/*
app.get('/getTx', function (req, res)
{
  var txHash=ethereumModule.getLatest();
  if(txHash!=null&&txHash!="")
  {
    res.send('Latest tx https://ropsten.etherscan.io/tx/'+txHash);
  }
  else
  {
    res.send('No tx yet during current session.');
  }
});
app.get('/getFromEthereum', function (req, res)
{
  var txHash=ethereumModule.getLatest();
  if(txHash!=null&&txHash!="")
  {
    var dataToDecrypt = ethereumModule.getFromEthereum(txHash);
    var decryptedData = cryptoModule.decryptString(dataToDecrypt,cryptoPassword)
    var timestampFromEthereum = ethereumModule.getTimestamp(txHash,"string");
    if(debug)
    {
      console.log("searching for: " + txHash);
      console.log("before decryption: " + dataToDecrypt);
      console.log("after decryption: " + decryptedData);
    }
    res.send("Packet info fetched from Ethereum: " + decryptedData +"\nTime: "+timestampFromEthereum);
    //res.render('barcode2');
  }
  else
  {
    res.send('No tx yet during current session.');
  }
});
*/

//this is the command for geth CLI to start the rpc, unless done with parameters when starting geth
//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")
//correct parameters in this case would be
//geth --testnet --fast --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"
