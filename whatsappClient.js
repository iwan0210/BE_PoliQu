const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true })
});

client.on('ready', () => {
  console.log('✅ WhatsApp Client is READY')
});

client.on('disconnected', reason => {
  console.log('⚠️ Client was logged out:', reason)
});

client.initialize()

module.exports = client