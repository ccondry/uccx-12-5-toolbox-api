const CMS = require('cms-api-client')
const teamsLogger = require('./teams-logger')

const client = new CMS({
  url: process.env.CMS_URL,
  username: process.env.CMS_USERNAME,
  password: process.env.CMS_PASSWORD
})

module.exports = {
  async sync () {
    try {
      await client.ldapSyncs.sync()
    } catch (e) {
      const message = 'Failed to start CMS LDAP sync: ' + e.message
      console.log(message)
      // console.log(message, e)
      teamsLogger.log(message)
    }
  }
}
