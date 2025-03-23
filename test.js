const CryptoJS = require('crypto-js')

var text = JSON.stringify({ medicalRecordId: '11A1764225B11AA1', valid: Date.now() + 15 * 60 * 1000 });
var key = '11A1764225B11AA1'; 

console.log('text:', text);
console.log('key:', key);
console.log('key length:', key.length );

// Fix: Use the Utf8 encoder
text = CryptoJS.enc.Utf8.parse(text); 
// Fix: Use the Utf8 encoder (or apply in combination with the hex encoder a 32 hex digit key for AES-128)
key = CryptoJS.enc.Utf8.parse(key); 

// Fix: Apply padding (e.g. Zero padding). Note that PKCS#7 padding is more reliable and that ECB is insecure
var encrypted = CryptoJS.AES.encrypt(text, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding }); 
encrypted = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
console.log('encrypted', encrypted);

// Fix: Pass a CipherParams object (or the Base64 encoded ciphertext)
var decrypted =  CryptoJS.AES.decrypt({ciphertext: CryptoJS.enc.Hex.parse(encrypted)}, key, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding }); 

// Fix: Utf8 decode the decrypted data
console.log('decrypted', JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))); 