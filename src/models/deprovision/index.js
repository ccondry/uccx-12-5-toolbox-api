// import the lib wrapper files that are only used for deprovision
const cucm = require('./cucm')
const uccx = require('./uccx')
const ldap = require('./ldap')

module.exports = async function (user) {
  try {
    console.log(await ldap.deleteDemoUsers(user))
    console.log(await ldap.deleteDemoAdmins(user))
    console.log(await cucm.deleteJabberPhones(user))
    console.log(await cucm.deleteJabberLines(user))
    console.log(await uccx.deleteCsqs(user))
    console.log(await uccx.deleteChatWidgets(user))
    console.log(await uccx.deleteSkills(user))
    console.log(await uccx.deleteTeams(user))
    console.log(await uccx.deleteApplications(user))
    console.log(await uccx.deleteCalendars(user))
    console.log(await uccx.deleteTriggers(user))
    console.log(await uccx.deleteCampaigns(user))
  } catch (e) {
    console.log(e)
  }
}
