require('dotenv').config()

const uccx = require('../src/models/uccx')

const userId = '0325'

uccx.resource.get('sjeffers' + userId)
.then(agent => {
  console.log(agent)
})
.catch(e => {
  console.log(e.message)
})