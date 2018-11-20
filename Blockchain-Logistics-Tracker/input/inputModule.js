var debug = true;
//var sanitizedInput=null;
var sanitizeInput = function(input)
{
  while(input.includes("'")||input.includes('"')||input.includes("’")||input.includes('”'))
  {
    input=input.replace("'","");
    input=input.replace('"','');
    input=input.replace("’","");
    input=input.replace('”','');
  }
  while(input.includes(',')||input.includes(';')||input.includes(':'))
  {
    input=input.replace(",","");
    input=input.replace(';','');
    input=input.replace(':','');
  }
  if(debug)
    console.log("sanitized: "+input);
  return input;
}

var jsonifyString = function(packetIdFromClient,activity,userNameFromClient,companyNameFromClient,latitude,longitude,addressJSON)
{
  var jsonifiedString = '"packetID":"'+packetIdFromClient+'","activity":"'+activity+'","userName":"'+userNameFromClient+'","companyName":"'+companyNameFromClient+'","gpsLatitude":"'+latitude+'","gpsLongitude":"'+longitude+'","locationByGPS":'+addressJSON;
  return jsonifiedString;
}

exports.sanitizeInput=sanitizeInput;
exports.jsonifyString=jsonifyString;
