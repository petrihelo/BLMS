// Define JSON File
 var fs = require("fs");
 //console.log("\n *STARTING* \n");
 var contents = fs.readFileSync("../storage/companyAccounts.json");
 var jsonContent = JSON.parse(contents);
console.log(JSON.stringify(jsonContent));
console.log(jsonContent.companies.VR.accountID);
for(var company in jsonContent.companies)
{
  console.log(jsonContent.companies[company].accountID);
}
