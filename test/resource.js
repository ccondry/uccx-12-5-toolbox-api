require('dotenv').config()

const uccx = require('../src/models/uccx')
const db = require('../src/models/db')

const userId = '0325'

uccx.resource.get('jopeters' + userId)
.then(agent => {
  console.log(agent)
})
.catch(e => {
  console.log(e.message)
})

// add provision info to database
function markProvision(userId, updates) {
  db.updateOne('toolbox', 'user.provision', {userId}, updates)
  .catch(e => console.log('failed to update provision info in database', e.message))
}

async function updateAgentSkillMap (agent, skillMap) {
  try {
    // update agent skill map
    agent.skillMap = skillMap
    await uccx.resource.modify('hliang' + userId, agent)
    console.log('skillMap set for hliang' + userId)
    markProvision(userId, {$set: {hliangSkillMap: true}})
  } catch (e) {
    try {
      // check for returned API errors
      const errors = e.response.body.apiError
      for (const error of errors) {
        console.error('Failed to set skill map:', error.errorMessage)
        // send to log events room
        teamsLogger.error(`Failed to set skill map for hliang${userId}: ${error.errorMessage}`)
      }
    } catch (e2) {
      // just console log it then
      console.error('failed to set skill map for hliang' + userId, e.message)
      // and send to log events room
      teamsLogger.error(`Failed to set skill map for hliang${userId}: ${e.message}`)
    }
    // and continue provision
  }
}