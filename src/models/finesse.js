const finesseClient = require('finesse-client')

const finesse = new finesseClient({
  host: process.env.FINESSE_HOST,
  username: process.env.FINESSE_USER,
  password: process.env.FINESSE_PASSWORD
})

module.exports = finesse