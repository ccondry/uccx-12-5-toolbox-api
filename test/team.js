require('dotenv').config()

// const uccx = require('../src/models/uccx')
// const finesse = require('../src/models/finesse')
const provision = require('../src/models/provision')

// const userId = '0325'

// uccx.team.get('Cumulus_' + userId)
// .then(r => {
//   console.log(r)
// })
// .catch(e => {
//   console.log(e.message)
// })

// finesse.list('Team')
// .then(r => {
//   console.log(r)
// })
// .catch(e => {
//   console.log(e.message)
// })

provision.copyLayoutConfig('CumulusMain', 'Cumulus_0325')
.then(r => {
  console.log('done')
})
.catch(e => {
  console.log(e.message)
})

// const teams = await uccx.team.list