require('dotenv').config()

const deprovision = require('../src/models/deprovision')
const uccx = require('../src/models/uccx')

async function main () {
  const teams = await uccx.team.list()
  for (const team of teams) {
    try {
      const id = team.teamname.split('_').pop()
      if (id !== '0325') {
        await deprovision({id})
        console.log('successfully deprovisioned user', id)
      }
    } catch (e) {
      console.log('failed to deprovision user', id, ':', e.message)
    }
  }
}  

main()