var debug = false;
var fs = require("fs");
var findCompanyAccount = function(searchTerm)
{
  var accountID="";
  var contents = fs.readFileSync("./storage/companyAccounts.json");
  var jsonContent = JSON.parse(contents);
  for(var company in jsonContent.companies)
  {
    if(jsonContent.companies[company].companyName==searchTerm)
    {
      accountID = jsonContent.companies[company].accountID;
    }
    if(debug)
    {
    console.log("search term: "+searchTerm);
    console.log("json company: "+jsonContent.companies[company].companyName);
    if(searchTerm==jsonContent.companies[company].companyName)
      console.log("MATCH");
    console.log("json account: "+jsonContent.companies[company].accountID);
    //console.log("as variable: "+accountID);
    }
  }
  if(accountID=="")
  {
    console.log("No company account found. Using default account for miscallenous.");
    return "0xf81D26ae334E416d09828312794A3c2F0A81B02A";
  }
  else
  {
    return accountID;
  }
}
exports.findCompanyAccount=findCompanyAccount;
