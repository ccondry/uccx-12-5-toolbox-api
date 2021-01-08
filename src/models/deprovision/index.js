// import the lib wrapper files that are only used for deprovision
const cucm = require('./cucm')
const uccx = require('./uccx')
const ldap = require('./ldap')
const db = require('../db')

module.exports = async function (user) {
  try {
    // delete LDAP accounts
    console.log('delete demo agents:', await ldap.deleteDemoUsers(user))
    console.log('delete demo users:', await ldap.deleteDemoAdmins(user))
    // delete CUCM phones and numbers
    console.log('delete jabber phones:', await cucm.deleteJabberPhones(user))
    console.log('delete jabber lines:', await cucm.deleteJabberLines(user))
    // sync CUCM LDAP
    console.log('initiating CUCM LDAP sync:', cucm.doLdapSync(process.env.LDAP_DIRECTORY))
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
