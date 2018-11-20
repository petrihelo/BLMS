var qr = require('qrcode');

qr.toFile('../public/qr.png', '0123456789ABCDEF0123456789ABCDEF', {
  color: {
    dark: '#000000',  // Blue dots
    light: '#0000' // Transparent background
  }
}, function (err) {
  if (err) throw err
  console.log('done');
})
