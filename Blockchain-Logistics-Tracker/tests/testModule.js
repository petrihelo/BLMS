//MOVE TO ROOT FOLDER TO APPLY THIS TEST
var txFunction = require('./ethereum/ethereumModule.js');
var printable = txFunction.getFromEthereumFunction("0x84b9cd3e0338a01acde588168f90d7316163619a7a44ed12492feb6e66559661");
console.log("returned from module "+printable);
