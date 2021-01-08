// import the lib wrapper files that are only used for deprovision
const cucm = require('./cucm')
const uccx = require('./uccx')
const ldap = require('./ldap')
const db = require('../db')

// max number of retries to wait for UCCX to import new resources (agents)
const maxResourceRetries = 30
// delay in ms to wait for UCCX to import new resources (agents)
const resourceRetryDelay = 20 * 1000

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uccxSync (user, username) {
  let retries = 0
  // try getting agent1, trying up to "maxResourceRetries" times before throwing error
  while (retries <= maxResourceRetries) {
    try {
      // try to get resource
      console.log(`trying to find ${username}${user.id}...`)
      agent = await uccx.lib.resource.get(username + user.id)
      // found
      const seconds = Math.floor(resourceRetryDelay / 1000)
      console.log(`${username}${user.id} found. waiting ${seconds} seconds and then trying again...`)
      // wait a moment and try again
      await sleep(resourceRetryDelay)
      // increment retry counter
      retries++
      continue
    } catch (e) {
      // failed to get resource
      if (e.statusCode === 404) {
        // not found. success!
        console.log(`${username}${user.id} no longer exists in UCCX.`)
        break
      } else {
        throw e
      }
    }
  }
}

module.exports = async function (user) {
  try {
    // delete LDAP accounts
    console.log('delete demo agents:', await ldap.deleteDemoUsers(user))
    console.log('delete demo users:', await ldap.deleteDemoAdmins(user))
    // delete CUCM phones and numbers
    console.log('delete jabber phones:', await cucm.deleteJabberPhones(user))
    console.log('delete jabber lines:', await cucm.deleteJabberLines(user))
    // sync CUCM LDAP
    console.log('initiating CUCM LDAP sync:', await cucm.lib.doLdapSync(process.env.LDAP_DIRECTORY))
    // wait for CUCM sync to remove resources from UCCX
    console.log('waiting for CUCM LDAP sync to remove the users from UCCX...')
    await uccxSync(user, 'sjeffers')
    await uccxSync(user, 'jopeters')
    await uccxSync(user, 'rbarrows')
    await uccxSync(user, 'hliang')
    await uccxSync(user, 'jabracks')
    // delete UCCX objects
    console.log('delete CSQs:', await uccx.deleteCsqs(user))
    console.log('delete chat widgets:', await uccx.deleteChatWidgets(user))
    console.log('delete skills:', await uccx.deleteSkills(user))
    console.log('delete teams:', await uccx.deleteTeams(user))
    console.log('delete applications:', await uccx.deleteApplications(user))
    console.log('delete calendars:', await uccx.deleteCalendars(user))
    console.log('delete triggers:', await uccx.deleteTriggers(user))
    console.log('delete campaigns:', await uccx.deleteCampaigns(user))
    // delete user provision info
    await db.deleteOne('toolbox', 'user.provision', {userId: user.id})
    console.log('deleted user provision info from database')
    // delete user cumulus config info
    await db.deleteOne('toolbox', 'cumulus.config', {userId: user.id})
    console.log('deleted user branding config info from database')
    process.exit(0)
  } catch (e) {
    console.log(e)
  }
}
