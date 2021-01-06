require('dotenv').config()

const uccx = require('../src/models/uccx')

uccx.trigger.get('6016')
.then(r => {
  console.log(JSON.stringify(r, null, 2))
})
.catch(e => {
  console.log(e.message)
})
