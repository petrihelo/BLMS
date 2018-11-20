var debug = true;
var sqlite3 = require('sqlite3').verbose();

var transactionDatabaseFilepath = "./storage/transactionTrackingDB.db"

var count=-1;
var foundEntries=null;
var list=null;

var isReserved = function()
{
  if(count==-1&&foundEntries==null&&list==null)
  {
    return false;
  }
  else
  {
    if(debug)
    {
      console.log("busy with:");
      console.log("count "+count);
      console.log("found "+foundEntries);
      console.log("list "+list);
    }
    return true;
  }
}

var saveToDB = function(packetIdFromClient,txHash)
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.run("INSERT INTO TX(packetID,transactionID) VALUES('"+packetIdFromClient+"','"+txHash+"')");
  });
  txdb.close();
}

var addTimestamp = function(txHash,unixTimestamp)
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.run("UPDATE TX SET timestamp= '"+unixTimestamp+"' WHERE transactionID='"+txHash+"'");
  });
  txdb.close();
}



var loadFromDB = function(searchTerm)
{
  tempEntries1="";
  tempEntries2="";
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.each("SELECT * FROM TX WHERE packetID='"+searchTerm+"'", function(err, row) {
      if(row != null)
      {
        tempEntries1+="'"+row.packetID+"':'"+row.transactionID+"',";
      }
    });
  });
  txdb.close();
  var checkIfEntriesUpdated = setInterval(function()
  {
    if(tempEntries1!=tempEntries2)
    {
      tempEntries2=tempEntries1;
    }
    else
    {
      foundEntries=tempEntries1;
      clearInterval(checkIfEntriesUpdated);
    }
  },30);
}
var returnTXEntries = function()
{
  var returningFoundEntries=foundEntries;
  foundEntries=null;
  return returningFoundEntries;
}

var checkCountForPacket = function(searchTerm)
{
  var tempCount1=0;
  var tempCount2=0;
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.each("SELECT * FROM TX WHERE packetID='"+searchTerm+"'", function(err, row) {
      if(row != null)
      {
        tempCount1+=1;
      }
    });
  });
  txdb.close();
  //checks every 15ms if each function found more. this is so that we dont change (and therefore return) count before it has processed all rows from db
  var checkIfCountUpdated = setInterval(function()
  {
    if(tempCount1>tempCount2)
    {
      tempCount2=tempCount1;
    }
    else
    {
      count=tempCount1;
      clearInterval(checkIfCountUpdated);
    }
  },30);
}
var returnCount = function()
{
  var returningCount;
  returningCount=count;
  count=-1;
  //if(debug)
  //console.log("reseted count "+count);
  return returningCount;
}

var listPacketID = function()
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  list = "";
  txdb.each("SELECT * FROM TX ORDER BY timestamp DESC", function(err, row) {
    if(row != null)
    {
      if(!list.includes(";"+row.packetID+";"))
      list+=";"+row.packetID;
    }
  });
  txdb.close();
}

var returnPacketList = function()
{
  var returningList = list;
  list = null;
  return returningList;
}

//Company accounts are stored in JSON file.
/*
var findCompanyAccountFromDatabase = function(companyName)
{
var companydb = new sqlite3.Database(companyDatabaseFilepath);
companydb.serialize(function()
{
companydb.get("SELECT * FROM COMPANYACCOUNTS WHERE companyName='"+companyName+"'", function(err, row) {
if(row!= null)
{
//console.log("found "+row.companyName + " " + row.accountID);
foundCompanyAccount = row.accountID;
}
else
{
console.log("No company found. Using default account for misc.");
foundCompanyAccount = "0xf81D26ae334E416d09828312794A3c2F0A81B02A";
}
});
});
companydb.close();
}
var returnCompanyAccount = function()
{
return foundCompanyAccount;
foundCompanyAccount="";
}
*/

exports.isReserved=isReserved;

exports.saveToDB=saveToDB;
exports.addTimestamp=addTimestamp;

exports.loadFromDB=loadFromDB;
exports.returnTXEntries=returnTXEntries;

exports.checkCountForPacket=checkCountForPacket;
exports.returnCount=returnCount;

exports.listPacketID=listPacketID;
exports.returnPacketList=returnPacketList;

//exports.findCompanyAccountFromDatabase=findCompanyAccountFromDatabase;
//exports.returnCompanyAccount=returnCompanyAccount;
