var databaseModule = require('../db/databaseModule.js');
var databaseModule2 = require('../db/databaseModule.js');

//databaseModule.checkCountForPacket("1234");
databaseModule.loadFromDB("1234");
databaseModule2.loadFromDB("11");

//points out that databaseModule and databaseModule2 are NOT NEW INSTANCES, but merely holding the memory address.
setTimeout(returnValues,100);
function returnValues()
{
  var table = databaseModule.returnTXEntries();
  console.log(table);
  setTimeout(function()
  {
    var table2 = databaseModule2.returnTXEntries();
    console.log(table2);
  },500);
}
