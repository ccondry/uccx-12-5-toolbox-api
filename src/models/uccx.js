// UCCX config API client library
const client = require('uccx-config-client')
const validate = require('./validate')

// validate .env vars
validate([
  'UCCX_ADMIN_API_URL',
  'UCCX_ADMIN_USERNAME',
  'UCCX_ADMIN_PASSWORD'
])

// init UCCX config API client
const uccx = new client({
  url: process.env.UCCX_ADMIN_API_URL,
  username: process.env.UCCX_ADMIN_USERNAME,
  password: process.env.UCCX_ADMIN_PASSWORD
})

module.exports = uccx
