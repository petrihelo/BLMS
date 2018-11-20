const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'logistiikka');
const decipher = crypto.createDecipher('aes192', 'logistiikka');

let encrypted = cipher.update('jotain tekstia', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);

let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
