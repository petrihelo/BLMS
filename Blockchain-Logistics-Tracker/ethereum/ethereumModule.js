var debug = true;
var Web3 = require('web3');
//var util = require('ethereumjs-util');
var tx = require('ethereumjs-tx');
var databaseModule = require('../db/databaseModule.js');
var txHash;
var previousNonce=0;
var web3 = new Web3();

function connectEthereum()
{
  web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));
  if(web3.isConnected())
  {
    console.log("Using local node.")
  }
  else
  {
    console.log("Can't connect to local node. Trying remote node.")
    web3.setProvider(new web3.providers.HttpProvider("https://ropsten.infura.io/"));
    if(web3.isConnected())
    {
      console.log("Connected to remote node.")
    }
    else
    {
      console.log("No connection or remote API key. Program will exit.")
      process.exit(0);
    }
  }
}

var saveTransaction = function(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient)
{
  //this is for fastly repeated run so that nonce is increased if transactioncount didnt update fast enough in ethereum
  var dynamicNonce = web3.eth.getTransactionCount(fromAccount);
  if(dynamicNonce<=previousNonce)
    dynamicNonce=previousNonce+1;
  previousNonce = dynamicNonce;
  if(debug)
    console.log("NONCE " + dynamicNonce);
  var rawTx =
  {
    from: fromAccount,
    to: toAccount,
    value: web3.toHex(0),
    //this methdod fetches the integer that represents the count of transactions.
    nonce: web3.toHex(dynamicNonce),
    gasLimit: web3.toHex(800000),
    gasPrice: web3.toHex(20000000000),
    data: web3.toHex(encryptedDataToSave)
  };
  var transaction = new tx(rawTx);
  var hexPrivateKey = new Buffer(privateKey, 'hex');
  transaction.sign(hexPrivateKey);
  var serializedTx = transaction.serialize().toString('hex');
  web3.eth.sendRawTransaction(
  '0x' + serializedTx, function(err, result)
  {
      if(err)
      {
        console.log(err);
      }
      else
      {
        txHash=result;
        var timeStamp="";
        databaseModule.saveToDB(packetIdFromClient,result);
        var intervalFunction = setInterval(function delayTimestamp()
        {
          var found = false;
            try
            {
              timeStamp = getTimestamp(result,"unix");
            } catch (e)
            {
              if(debug)
                console.log("Waiting for Block to be mined...");
            }
            if(timeStamp!="")
            {
              databaseModule.addTimestamp(result,timeStamp);
              clearInterval(intervalFunction);
              if(debug)
                console.log("Block mined with timestamp: "+getTimestamp(result,"string")+". Added to DB entry.");
            }
        }
        ,10000);
        if(debug)
        {
          console.log("Transaction for packet "+packetIdFromClient+" saved to database.")
          console.log("Transaction made with identifier: "+result);
        }
        timeStamp="";
      }
  });
}

var getLatest = function()
{
  return txHash;
}

var getFromEthereum = function(searchTerm)
{
  var transactionFromEthereum = web3.toAscii(web3.eth.getTransaction(searchTerm).input);
  return transactionFromEthereum;
}

var getTimestamp = function(tx,mode)
{
  var unixTimeStamp = web3.eth.getBlock(web3.eth.getTransaction(tx).blockNumber).timestamp;
  var timestamp = new Date(unixTimeStamp*1000);
  if(mode=="unix")
  {
    return unixTimeStamp;
  }
  else if(mode=="date")
  {
    return timestamp;
  }
  else if(mode=="string")
  {
    return timestamp.toString();
  }
}

var getNonce = function(searchTerm)
{
  var nonce = web3.eth.getTransactionCount(searchTerm);
  return nonce;
}

exports.connectEthereum=connectEthereum;
exports.saveTransaction=saveTransaction;
exports.getFromEthereum=getFromEthereum;
exports.getLatest=getLatest;
exports.getTimestamp=getTimestamp;
exports.getNonce = getNonce;
