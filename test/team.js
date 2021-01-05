require('dotenv').config()

const uccx = require('../src/models/uccx')

const userId = '0325'

// uccx.team.get('Cumulus_' + userId)
// .then(r => {
//   console.log(r)
// })
// .catch(e => {
//   console.log(e.message)
// })

uccx.team.list()
.then(r => {
  console.log(r)
})
.catch(e => {
  console.log(e.message)
})

const teams = await uccx.team.list