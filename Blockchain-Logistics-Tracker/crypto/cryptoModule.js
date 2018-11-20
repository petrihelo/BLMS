const crypto = require('crypto');
var encryptString = function(dataToEncrypt,password)
{
  var cipher = crypto.createCipher('aes192', password);
  let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
var decryptString = function (dataToDecrypt,password)
{
  var decipher = crypto.createDecipher('aes192', password);
  let decrypted = decipher.update(dataToDecrypt, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
exports.encryptString=encryptString;
exports.decryptString=decryptString;
