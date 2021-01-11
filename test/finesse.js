require('dotenv').config()

const finesse = require('../src/models/finesse')

// finesse.get('Team', '5')
// .then(r => {
//   console.log(r)
// })
// .catch(e => {
//   console.log(e.message)
// })

finesse.list('Team')
.then(r => {
  console.log(r)
  r.find(v => {
    v.name === 'Cumulus_0325'
  })
})
.catch(e => {
  console.log(e.message)
})
