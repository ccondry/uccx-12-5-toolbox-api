const uccx = require('./uccx')
const ldap = require('./ldap')
const cucm = require('./cucm')

const jabberPhone = require('./jabber-phone')
// const mobileAgentPhone = require('./mobile-agent-phone')
// const extendAndConnectPhone = require('./extend-and-connect-phone')
// const camelotPhone = require('./camelot-phone')

const voiceCsqTemplate = require('./templates/voice-csq')
const emailCsqTemplate = require('./templates/email-csq')
const chatCsqTemplate = require('./templates/chat-csq')
const chatWidgetTemplate = require('./templates/chat-widget')
const applicationTemplate = require('./templates/application')
const campaignTemplate = require('./templates/campaign')
const triggerTemplate = require('./templates/trigger')

const validate = require('./validate')

const createEmail = require('./create-email')
const db = require('./db')

// Webex Teams logging
const teamsLogger = require('./teams-logger')

// validate .env vars
validate([
  'LDAP_LAB_USERS_DN',
  'LDAP_DOMAIN',
  'LDAP_USER_AGENTS_DN',
  'LDAP_DIRECTORY',
  'UCCX_ADMIN_API_URL',
  'ROUTE_PARTITION',
  'VPN_USER_GROUP'
])
// constants
const VPN_USER_GROUP = process.env.VPN_USER_GROUP || 'CN=Demo Admins,CN=Users,DC=dcloud,DC=cisco,DC=com'
const DOMAIN_ADMINS_USER_GROUP = 'CN=Domain Admins,CN=Users,DC=dcloud,DC=cisco,DC=com'

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// test user ID
// const userId = '0021'
const agentPassword = 'C1sco12345'
// max number of retries to wait for UCCX to import new resources (agents)
const maxResourceRetries = 30
// delay in ms to wait for UCCX to import new resources (agents)
const resourceRetryDelay = 20000
// start the provision
// provision(userId)
// .then(r => console.log('successfully provisioned user', userId, r))
// .catch(e => console.error('failed to provision user', userId, e.message))

//
// findOrCreatePhones(userId)
// .then(r => console.log('find or create phones successful'))
// .catch(e => console.error('find or create phones failed', e.message))

// uccx.team.get(4)
// .then(r => console.log(JSON.stringify(r, null, 2)))
// .catch(e => console.error(e.message))
async function setIpccExtension (username, extension, routePartition) {
  try {
    let existing = await cucm.getEndUserIpccExtension(username)
    // was the response not an array?
    if (!Array.isArray(existing)) {
      // then make it a single-value array
      existing = [existing]
    }
    // there could be multiple records, if a script has inserted them
    for (const n of existing) {
      if (n.dnorpattern === extension && n.routepartition === routePartition) {
        // already set to this extension
        console.log(username, 'IPCC extension is already set to', extension, 'in route partition', routePartition)
        // done
        return
      } else {
        // already set to another extension - remove this value
        await cucm.deleteEndUserIpccExtension(username, n.dnorpattern, n.routepartition)
      }
    }
    // the value we want is not set. set it now
    await cucm.insertEndUserIpccExtension(username, extension, routePartition)
    console.log('set', username, 'IPCC extension to', extension, 'in route partition', routePartition)
  } catch (e) {
    console.log('failed to set IPCC extension for username', username, 'to', extension, 'in route partition', routePartition)
  }
}

// update the demo config for a user
// function updateDemoConfig (userId, params) {
//   // return db.upsert('cumulus.config', {userId}, {$set: params})
//   // send request to toolbox
//   toolbox.updateDemoConfig(userId, params)
// }

async function findOrCreatePhones (userId) {
  try {
    // Jabber Phones
    await jabberPhone.create(cucm, {
      pattern: '1080' + userId,
      username: 'sjeffers' + userId,
      alertingName: 'Sandra Jefferson'
    })
    await jabberPhone.create(cucm, {
      pattern: '1081' + userId,
      username: 'jopeters' + userId,
      alertingName: 'Josh Peterson'
    })
    await jabberPhone.create(cucm, {
      pattern: '1082' + userId,
      username: 'rbarrows' + userId,
      alertingName: 'Rick Barrows'
    })

    // Mobile Agent Phones
    // await mobileAgentPhone.create(cucm, {
    //   lcpPattern: '1090' + userId,
    //   rcpPattern: '2090' + userId,
    //   username: 'sjeffers' + userId,
    //   alertingName: 'Sandra Jefferson'
    // })
    // await mobileAgentPhone.create(cucm, {
    //   lcpPattern: '1091' + userId,
    //   rcpPattern: '2091' + userId,
    //   username: 'jopeters' + userId,
    //   alertingName: 'Josh Peterson'
    // })
    // await mobileAgentPhone.create(cucm, {
    //   lcpPattern: '1092' + userId,
    //   rcpPattern: '2092' + userId,
    //   username: 'rbarrows' + userId,
    //   alertingName: 'Rick Barrows'
    // })
    //
    // // Extend & Connect Phones
    // await extendAndConnectPhone.create(cucm, {
    //   pattern: '1060' + userId,
    //   username: 'sjeffers' + userId,
    //   alertingName: 'Sandra Jefferson'
    // })
    // await extendAndConnectPhone.create(cucm, {
    //   pattern: '1061' + userId,
    //   username: 'jopeters' + userId,
    //   alertingName: 'Josh Peterson'
    // })
    // await extendAndConnectPhone.create(cucm, {
    //   pattern: '1062' + userId,
    //   username: 'rbarrows' + userId,
    //   alertingName: 'Rick Barrows'
    // })
    //
    // // Camelot Phones
    // await camelotPhone.create(cucm, {
    //   pattern: '1070' + userId,
    //   username: 'sjeffers' + userId,
    //   alertingName: 'Sandra Jefferson'
    // })
    // await camelotPhone.create(cucm, {
    //   pattern: '1071' + userId,
    //   username: 'jopeters' + userId,
    //   alertingName: 'Josh Peterson'
    // })
    // await camelotPhone.create(cucm, {
    //   pattern: '1072' + userId,
    //   username: 'rbarrows' + userId,
    //   alertingName: 'Rick Barrows'
    // })
  } catch (e) {
    throw e
  }
}

// create LDAP user for VPN account
function findOrCreateLdapVpnUser (user, password) {
  return findOrCreateAgentLdapUser({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    commonName: user.username,
    // domain: process.env.LDAP_DOMAIN,
    // physicalDeliveryOfficeName: user.id,
    telephoneNumber: '1084' + user.id,
    userId: user.id,
    mail: user.email,
    description: 'VPN account',
    usersDn: process.env.LDAP_LAB_USERS_DN,
    password: password
  })
}

// create LDAP users for agents sjeffers, jopeters, rbarrows
async function findOrCreateLdapUsers (userId) {
  let supervisor
  let agent1
  let agent2

  try {
    supervisor = await findOrCreateAgentLdapUser({
      firstName: 'Rick ' + userId,
      lastName: 'Barrows',
      username: 'rbarrows' + userId,
      userId: userId,
      telephoneNumber: '1082' + userId,
      password: agentPassword
    })
  } catch (e) {
    console.log('failed to find or create LDAP user', 'rbarrows' + userId, e.message)
  }

  try {
    agent1 = await findOrCreateAgentLdapUser({
      firstName: 'Sandra ' + userId,
      lastName: 'Jefferson',
      username: 'sjeffers' + userId,
      userId: userId,
      telephoneNumber: '1080' + userId,
      password: agentPassword
    })
  } catch (e) {
    console.log('failed to find or create LDAP user', 'sjeffers' + userId, e.message)
  }

  try {
    agent2 = await findOrCreateAgentLdapUser({
      firstName: 'Josh ' + userId,
      lastName: 'Peterson',
      username: 'jopeters' + userId,
      userId: userId,
      telephoneNumber: '1081' + userId,
      password: agentPassword
    })
  } catch (e) {
    console.log('failed to find or create LDAP user', 'jopeters' + userId, e.message)
  }

  return {
    supervisor,
    agent1,
    agent2
  }
}

async function findOrCreateAgentLdapUser ({
  firstName,
  lastName,
  username,
  commonName,
  userId,
  telephoneNumber,
  password,
  mail,
  domain = process.env.LDAP_DOMAIN,
  description,
  usersDn = process.env.LDAP_USER_AGENTS_DN
}) {
  try {
    const user = await ldap.getUser(username)
    if (user) {
      return user
    } else if (password) {
      // console.log('creating LDAP user in group', process.env.LDAP_USER_AGENTS_DN)
      // construct body for request
      const body = {
        firstName,
        lastName,
        username,
        commonName,
        domain,
        physicalDeliveryOfficeName: userId,
        telephoneNumber,
        userId,
        mail: mail || username + '@' + process.env.LDAP_DOMAIN,
        usersDn,
        description
        // memberOf: process.env.LDAP_USER_AGENTS_DN
      }
      // log body without password
      // console.log('creating LDAP user. body:', body)
      // add password to body
      body.password = password
      // create user
      await ldap.createUser(body)
      // retrieve new user
      return ldap.getUser(username)
    } else {
      // no password supplied - return null user
      return null
    }
  } catch (e) {
    throw e
  }
}

// find specified skill, or create it if not found. then find specified CSQ, or
// create it with the new skill if it is not found.
// returns the CSQ and Skill reference URLs
async function findOrCreateSkillAndCsq ({
  skills,
  csqs,
  name,
  getCsqModel
}) {
  let skillRefUrl
  let csqRefUrl

  try {
    // find existing skill
    const skill = skills.find(v => v.skillName === name)

    if (skill) {
      // found skill
      skillRefUrl = skill.self
      console.log('found existing skill:', skillRefUrl)
    } else {
      //  skill not found - create now
      skillRefUrl = await uccx.skill.create({skillName: name})
      console.log('successfully created skill:', skillRefUrl)
    }
    console.log('searching for CSQ', name, 'in', csqs.length, 'CSQs...')
    const csq = csqs.find(v => v.name === name)
    
    // get the model
    const csqModel = getCsqModel(skillRefUrl)
    if (csq) {
      // found CSQ
      console.log('found existing CSQ:', csq.self)
      // validate the CSQ info
      // if creating email CSQ, check that it is provisioned as type = EMAIL
      if (csqModel.queueType !== csq.queueType) {
        // existing queue type does not match model
        console.log('existing CSQ queue type does not match expected type. Deleting and recreating CSQ', csqModel.name)
        // delete the existing one
        await uccx.csq.delete(csq.id)
        // recreate, and set the return value to the new CSQ ref URL
        csqRefUrl = await uccx.appAdmin.createCsq(csqModel)
        console.log('successfully recreated CSQ', csqModel.name, ':', csqRefUrl)
      } else {
        // set the return value to the existing CSQ ref URL
        csqRefUrl = csq.self
      }
    } else {
      // CSQ not found - create now
      console.log('CSQ not found. Creating CSQ with this model:', JSON.stringify(csqModel, null, 2))
      // use appAdmin to create CSQ, to get around hard 250 CSQ limit on the
      // normal REST API
      csqRefUrl = await uccx.appAdmin.createCsq(csqModel)
      console.log('successfully created CSQ:', csqRefUrl)
    }
  } catch (e) {
    // failed to get email info: 500 - {"apiError":[{"errorData":"Exception Occured","errorMessage":"The maximum number of feedIds was exceeded. Max=100","errorType":"InternalServerError"}]}
    // try to test for server exceptions like exceeding max CSQs
    try {
      // check all errors for exception occurred
      const errors = e.response.body.apiError
      for (const error of errors) {
        console.error('Failed to create skill and CSQ:', error.errorMessage)
        // send to log events room
        teamsLogger.error(`Failed to create skill and CSQ "${name}": ${error.errorMessage}`)
      }
    } catch (e2) {
      // ok not that error, just return it
      throw e
    }
  }

  return {
    csqRefUrl,
    skillRefUrl
  }
}

// find specified chat widget, or create it if not found
async function findOrCreateChatWidget ({
  name,
  model
}) {
  let refUrl
  try {
    // look for existing bubble chat widget with this name
    const widgets = await uccx.chatWidget.list()
    const widget = widgets.find(v => v.name === name)

    if (widget) {
      // found existing widget
      refUrl = widget.self
      console.log('found existing chat widget:', refUrl)
    } else {
      //  widget not found - create now
      refUrl = await uccx.chatWidget.create(model)
      console.log('successfully created chat widget:', refUrl)
    }
  } catch (e) {
    throw e
  }

  return {
    refUrl
  }
}

// find specified team, or create it if not found
// returns the Team name and Team reference URLs
async function findOrCreateTeam (teams, body) {
  let refUrl

  try {
    // find existing team
    const team = teams.find(v => v.teamname === body.teamname)

    if (team) {
      // found team
      refUrl = team.self
      console.log('found existing team:', refUrl)
    } else {
      //  team not found - create now
      console.log('creating team:', JSON.stringify(body, null, 2))
      refUrl = await uccx.team.create(body)
      console.log('successfully created team:', refUrl)
    }
  } catch (e) {
    throw e
  }

  return {
    name: body.teamname,
    refUrl
  }
}

function doCucmLdapSync (directory = process.env.LDAP_DIRECTORY) {
  console.log(`received request to sync CUCM LDAP directory`, directory)
  // start sync specified LDAP directory
  return cucm.doLdapSync(directory)
}

function getCucmLdapSyncStatus (directory = process.env.LDAP_DIRECTORY) {
  console.log(`received request to get CUCM LDAP directory sync info for`, directory)
  // get sync info
  return cucm.getLdapSyncStatus(directory)
}

// add provision info to database
function createProvision(userId, query) {
  db.upsert('toolbox', 'user.provision', {userId}, query)
  .catch(e => console.log('failed to create provision database', e.message))
}

// add provision info to database
function markProvision(userId, updates) {
  db.updateOne('toolbox', 'user.provision', {userId}, updates)
  .catch(e => console.log('failed to update provision database', e.message))
}

// main function
async function provision (user, password) {
  const userId = user.id
  // add provision info to database
  createProvision(userId, {
    status: 'working',
    cucmLdapSync: 'not started',
    uccxUserSync: 'not started'
  })

  let ldapUsers
  let skills = []
  let csqs = []
  let teams = []
  let voiceInfo = {}
  let outboundInfo = {}
  let emailInfo = {}
  let chatInfo = {}
  let widgetInfo = {}
  let teamInfo = {}
  let agent1
  let agent2
  let supervisor
  let vpnUser
  let calendarName = 'HolidayCalendar_' + userId
  let calendarId
  // supervisor username (ID)
  const supervisorId = 'rbarrows' + userId
  // IVR application name
  const applicationName = 'Customer_Service_' + userId
  // outbound preview campaign name
  const agentCampaignName = 'Agent_' + userId
  let agentCampaignId
  // outbound IVR campaign
  // const ivrCampaignName = 'IVR_' + userId
  // let ivrCampaignId
  // trigger dialed number for IVR campaign
  // const ivrTrigger = '1' + userId
  const applicationTrigger = '2' + userId

  // create LDAP user account for VPN
  try {
    // create VPN user in Demo Admins OU
    vpnUser = await findOrCreateLdapVpnUser(user, password)
    // console.log('found or created VPN LDAP user:', vpnUser)
    // add provision info to database
    markProvision(userId, {$set: {vpnUser: true}})
  } catch (e) {
    console.error('failed to find or create LDAP users', e.message)
    // fail out
    throw e
  }
  if (vpnUser) {
    try {
      // add VPN user to "Demo Admins" LDAP group
      await ldap.addToGroup({
        userDn: vpnUser.distinguishedName,
        groupDn: VPN_USER_GROUP
      })
      markProvision(userId, {$set: {vpnUserGroup: true}})
      console.log('added', vpnUser.distinguishedName, 'to LDAP group', VPN_USER_GROUP)
    } catch (e) {
      if (!e.message.includes('ENTRY_EXISTS')) {
        console.log('failed to add VPN LDAP user', user.username, 'to LDAP group', VPN_USER_GROUP, '. Continuing with provision. Error message was', e)
      }
      // continue
    }

    // add VPN user to "Domain Admins" LDAP group, if they are an admin in toolbox
    if (user.admin) {
      try {
        await ldap.addToGroup({
          userDn: vpnUser.distinguishedName,
          groupDn: DOMAIN_ADMINS_USER_GROUP
        })
        console.log('added', vpnUser.distinguishedName, 'to LDAP group', DOMAIN_ADMINS_USER_GROUP)
        markProvision(userId, {$set: {adminGroup: true}})
      } catch (e) {
        if (!e.message.includes('ENTRY_EXISTS')) {
          console.log('failed to add VPN LDAP user', user.username, 'to LDAP group', DOMAIN_ADMINS_USER_GROUP, '. Continuing with provision. Error message was', e)
        }
        // continue
      }
    }
  }
  // create LDAP users for sjeffers, jopeters, rbarrows
  try {
    ldapUsers = await findOrCreateLdapUsers(userId)
    console.log('found or created LDAP agent user accounts.')
    markProvision(userId, {$set: {ldapUsers: true}})
  } catch (e) {
    console.error('failed to find or create LDAP users', e.message)
    // fail out
    throw e
  }

  // start CUCM sync
  doCucmLdapSync()
  .then(r => console.log('CUCM LDAP user sync successfully started'))
  .catch(e => console.log('CUCM LDAP user sync failed:', e))

  // find all existing skills and CSQs
  try {
    skills = await uccx.skill.list()
    console.log('found', skills.length, 'Skills')
    csqs = await uccx.csq.list()
    console.log('found', csqs.length, 'CSQs')
    teams = await uccx.team.list()
    console.log('found', teams.length, 'Teams')
  } catch (e) {
    console.error('failed to get current list of Skills, CSQs, and Teams', e.message)
  }

  // generate voice CSQ data
  try {
    voiceInfo = await findOrCreateSkillAndCsq({
      skills,
      csqs,
      name: 'Voice_' + userId,
      getCsqModel: function (skillRefUrl) {
        return voiceCsqTemplate({
          name: 'Voice_' + userId,
          userId,
          skillRefUrl
        })
      }
    })
    console.log('voice info:', voiceInfo)
    markProvision(userId, {$set: {voiceCsq: true}})
  } catch (e) {
    console.error('failed to get voice info:', e.message)
  }

  // generate outbound CSQ data
  try {
    outboundInfo = await findOrCreateSkillAndCsq({
      skills,
      csqs,
      name: 'Outbound_' + userId,
      getCsqModel: function (skillRefUrl) {
        return voiceCsqTemplate({
          name: 'Outbound_' + userId,
          userId,
          skillRefUrl
        })
      }
    })
    markProvision(userId, {$set: {outboundCsq: true}})
    console.log('outbound info:', outboundInfo)
  } catch (e) {
    console.error('failed to get voice info:', e.message)
  }
  
  // generate email CSQ data
  try {
    const accountUserId = 'support_' + userId + '@dcloud.cisco.com'
    emailInfo = await findOrCreateSkillAndCsq({
      skills,
      csqs,
      name: 'Email_' + userId,
      getCsqModel: function (skillRefUrl) {
        return emailCsqTemplate({
          userId,
          skillRefUrl,
          channelProviderId: '1',
          channelProviderRefUrl: process.env.UCCX_ADMIN_API_URL + '/channelProvider/1',
          accountUserId
        })
      }
    })
    console.log('email info:', emailInfo)
    markProvision(userId, {$set: {emailCsq: true}})
    // try {
    //   const supportEmail = accountUserId
    //   // set supportEmail in user's demo config, for cumulus demo and brand demo website
    //   // await updateDemoConfig(userId, {supportEmail})
    //   console.log('successfully updated user demo config with supportEmail =', supportEmail)
    // } catch (e) {
    //   console.error('failed to update user demo config with supportEmail =', supportEmail)
    // }
  } catch (e) {
    console.error('failed to get email info:', e.message)
  }

  // generate chat CSQ data
  try {
    chatInfo = await findOrCreateSkillAndCsq({
      skills,
      csqs,
      name: 'Chat_' + userId,
      getCsqModel: function (skillRefUrl){
        return chatCsqTemplate({
          userId,
          skillRefUrl
        })
      }
    })
    markProvision(userId, {$set: {chatCsq: true}})
    console.log('chat info:', chatInfo)
    // let chatCsqId
    // try {
    // get chat CSQ ID
    // chatCsqId = chatInfo.csqRefUrl.split('/').pop()
    // set chat CSQ ID in user's demo config, for sparky-api to use later
    // await updateDemoConfig(userId, {chatCsqId})
    // console.log('successfully updated user demo config with chatCsqId =', chatCsqId)
    // } catch (e) {
    //   console.error('failed to get user demo chatCsqId', e.message)
    // }
  } catch (e) {
    console.error('failed to get chat info:', e.message)
  }

  // create bubble chat widget
  try {
    widgetInfo = await findOrCreateChatWidget({
      name: 'Chat_' + userId,
      model: chatWidgetTemplate({
        userId,
        chatCsqName: 'Chat_' + userId,
        chatCsqRefUrl: chatInfo.csqRefUrl
      })
    })
    console.log('created chat widget')
    markProvision(userId, {$set: {chatWidget: true}})
  } catch (e) {
    console.log('failed to create bubble chat widget for', userId, ':', e.message)
    teamsLogger.error(`Failed to create bubble chat widget for ${userId}: ${e.message}`)
  }

  // wait for CUCM LDAP sync to complete
  try {
    console.log('getting CUCM LDAP sync status...')
    let ldapSyncStatus = await getCucmLdapSyncStatus()
    // retry up to 10 times
    const maxRetries = 10
    let retries = 0
    while (ldapSyncStatus === 'Sync is currently under process' && retries <= maxRetries) {
      console.log('CUCM LDAP sync is in progress. Retry number', retries, '. Retrying in 1500ms...')
      markProvision(userId, {$set: {cucmLdapSync: 'waiting - attempt ' + (retries + 1)}})
      // wait a moment and try again
      await sleep(1500)
      ldapSyncStatus = await getCucmLdapSyncStatus()
      // increment retry counter
      retries++
    }
    // no longer 'under process' - check for doneness
    if (ldapSyncStatus !== 'Sync is performed successfully') {
      markProvision(userId, {$set: {cucmLdapSync: 'failed to complete - ' + ldapSyncStatus}})
      // undefined or unknown state - throw the status as an error
      // throw Error(ldapSyncStatus)
      console.warn('ldap sync status not good:', ldapSyncStatus)
      console.log('continuing with phone provision anyway')
    }
    // done - provision phones now
    console.log('CUCM LDAP sync is complete. Continuing provision...')
    markProvision(userId, {$set: {cucmLdapSync: 'completed'}})
  } catch (e) {
    console.error('failed to complete the CUCM LDAP sync:', e.message)
    // fail
    throw e
  }

  // add jabber phones
  try {
    await findOrCreatePhones(userId)
    console.log('agent phones successfully created')
    markProvision(userId, {$set: {phones: true}})
  } catch (e) {
    console.log('could not create all agent phones for user ID', userId, e.message)
    throw e
  }

  // set IPCC extension for CUCM users
  try {
    await setIpccExtension('sjeffers' + userId, '1080' + userId, process.env.ROUTE_PARTITION)
    markProvision(userId, {$set: {sjeffersIpccExtension: true}})
    await setIpccExtension('jopeters' + userId, '1081' + userId, process.env.ROUTE_PARTITION)
    markProvision(userId, {$set: {jopetersIpccExtension: true}})
    await setIpccExtension('rbarrows' + userId, '1082' + userId, process.env.ROUTE_PARTITION)
    markProvision(userId, {$set: {rbarrowsIpccExtension: true}})
  } catch (e) {
    console.log('could not set IPCC extensions for CUCM users:', e.message)
    throw e
  }

  let retries = 0

  // try getting agent1 up to maxResourceRetries times
  while (!agent1 && retries <= maxResourceRetries) {
    try {
      // try to get resource
      markProvision(userId, {$set: {uccxUserSync: 'working - attempt ' + retries}})
      console.log('trying to find', 'sjeffers' + userId)
      agent1 = await uccx.resource.get('sjeffers' + userId)
      console.log('sjeffers' + userId, 'found')
      break
    } catch (e) {
      // failed to get resource
      if (e.statusCode === 404) {
        // not found
        console.log('sjeffers' + userId, 'not found. waiting 20 seconds and then trying again.')
        // wait a moment and try again
        await sleep(resourceRetryDelay)
        // increment retry counter
        retries++
        continue
      } else {
        throw e
      }
    }
  }

  if (!agent1) {
    markProvision(userId, {$set: {uccxUserSync: 'Agents still not synced to UCCX after maximum retries (' + maxResourceRetries + ').'}})
    throw Error('sjeffers' + userId, 'was not found, even after waiting.')
  }

  // try getting agent2 up to maxResourceRetries times
  retries = 0
  while (!agent2 && retries <= maxResourceRetries) {
    try {
      // try to get resource
      console.log('trying to find', 'jopeters' + userId)
      agent2 = await uccx.resource.get('jopeters' + userId)
      console.log('jopeters' + userId, 'found')
      break
    } catch (e) {
      // failed to get resource
      if (e.statusCode === 404) {
        // not found
        console.log('jopeters' + userId, 'not found. waiting 20 seconds and then trying again.')
        // wait a moment and try again
        await sleep(resourceRetryDelay)
        // increment retry counter
        retries++
        continue
      } else {
        throw e
      }
    }
  }

  if (!agent2) {
    throw Error('jopeters' + userId, 'was not found, even after waiting.')
  }

  // try getting supervisor up to maxResourceRetries times
  retries = 0
  while (!supervisor && retries <= maxResourceRetries) {
    try {
      // try to get resource
      console.log('trying to find', 'rbarrows' + userId)
      supervisor = await uccx.resource.get('rbarrows' + userId)
      console.log('rbarrows' + userId, 'found')
      break
    } catch (e) {
      // failed to get resource
      if (e.statusCode === 404) {
        // not found
        console.log('rbarrows' + userId, 'not found. waiting 20 seconds and then trying again.')
        // wait a moment and try again
        await sleep(resourceRetryDelay)
        // increment retry counter
        retries++
        continue
      } else {
        throw e
      }
    }
  }

  if (!supervisor) {
    throw Error('rbarrows' + userId, 'was not found, even after waiting.')
  }

  markProvision(userId, {$set: {uccxUserSync: 'All agents synced successfully.'}})

  // set skill maps
  let skillMap = {
    skillCompetency: []
  }
  try {
    // set sjeffers skills
    // voice
    if (voiceInfo.skillRefUrl) {
      skillMap.skillCompetency.push({
        competencelevel: 5,
        skillNameUriPair: {
          '@name': 'Voice_' + userId,
          refURL: voiceInfo.skillRefUrl
        }
      })
    }
    // chat
    if (chatInfo.skillRefUrl) {
      skillMap.skillCompetency.push({
        competencelevel: 5,
        skillNameUriPair: {
          '@name': 'Chat_' + userId,
          refURL: chatInfo.skillRefUrl
        }
      })
    }
    // email
    if (emailInfo.skillRefUrl) {
      skillMap.skillCompetency.push({
        competencelevel: 5,
        skillNameUriPair: {
          '@name': 'Email_' + userId,
          refURL: emailInfo.skillRefUrl
        }
      })
    }
    // outbound
    if (outboundInfo.skillRefUrl) {
      skillMap.skillCompetency.push({
        competencelevel: 5,
        skillNameUriPair: {
          '@name': 'Outbound_' + userId,
          refURL: outboundInfo.skillRefUrl
        }
      })
    }
  } catch (e) {
    console.error('failed to build skill map', e.message)
    throw e
  }

  try {
    // update sjeffers skill map
    agent1.skillMap = skillMap
    // console.log('agent1 modified = ', JSON.stringify(agent1, null, 2))
    await uccx.resource.modify('sjeffers' + userId, agent1)
    console.log('skillMap set for sjeffers' + userId)
    markProvision(userId, {$set: {sjeffersSkillMap: true}})
  } catch (e) {
    try {
      // check for returned API errors
      const errors = e.response.body.apiError
      for (const error of errors) {
        console.error('Failed to set skill map:', error.errorMessage)
        // send to log events room
        teamsLogger.error(`Failed to set skill map for sjeffers${userId}: ${error.errorMessage}`)
      }
    } catch (e2) {
      // just console log it then
      console.error('failed to set skill map for sjeffers' + userId, e.message)
      // and send to log events room
      teamsLogger.error(`Failed to set skill map for sjeffers${userId}: ${e.message}`)
    }
    // and continue provision
  }

  try {
    // update jopeters skill map
    agent2.skillMap = skillMap
    await uccx.resource.modify('jopeters' + userId, agent2)
    console.log('skillMap set for jopeters' + userId)
    markProvision(userId, {$set: {jopetersSkillMap: true}})
  } catch (e) {
    try {
      // check for returned API errors
      const errors = e.response.body.apiError
      for (const error of errors) {
        console.error('Failed to set skill map:', error.errorMessage)
        // send to log events room
        teamsLogger.error(`Failed to set skill map for jopeters${userId}: ${error.errorMessage}`)
      }
    } catch (e2) {
      // just console log it then
      console.error('failed to set skill map for jopeters' + userId, e.message)
      // and send to log events room
      teamsLogger.error(`Failed to set skill map for jopeters${userId}: ${e.message}`)
    }
    // and continue provision
  }

  try {
    // update rbarrows skill map
    supervisor.skillMap = skillMap
    // set supervisor type
    // supervisor.type = 2
    await uccx.resource.modify('rbarrows' + userId, supervisor)
    console.log('skillMap set for rbarrows' + userId)
    markProvision(userId, {$set: {rbarrowsSkillMap: true}})
  } catch (e) {
    try {
      // check for returned API errors
      const errors = e.response.body.apiError
      for (const error of errors) {
        console.error('Failed to set skill map:', error.errorMessage)
        // send to log events room
        teamsLogger.error(`Failed to set skill map for rbarrows${userId}: ${error.errorMessage}`)
      }
    } catch (e2) {
      // just console log it then
      console.error('failed to set skill map for rbarrows' + userId, e.message)
      // and send to log events room
      teamsLogger.error(`Failed to set skill map for rbarrows${userId}: ${e.message}`)
    }
    // and continue provision
  }

  // modify rick barrows to be a supervisor
  try {
    await uccx.role.modify({
      username: 'rbarrows' + userId,
      extension: '1082' + userId,
      roles: 'Agent,Supervisor,Reporting'
    })

    console.log('successfully made', 'rbarrows' + userId, 'a supervisor')
    markProvision(userId, {$set: {rbarrowsSupervisor: true}})
  } catch (e) {
    console.error('failed to make', 'rbarrows' + userId, 'a supervisor')
    teamsLogger.error(`Failed to make rbarrows${userId} a supervisor: ${e.message}`)
  }

  // create Team
  try {
    const teamBody = {
      teamname: 'Cumulus_' + userId,
      primarySupervisor: {
        '@name': 'Rick Barrows',
        refURL: supervisor.self
      },
      resources: {
        resource: [
          {
            '@name': 'Rick Barrows',
            refURL: supervisor.self
          },
          {
            '@name': 'Sandra Jefferson',
            refURL: agent1.self
          },
          {
            '@name': 'Josh Peterson',
            refURL: agent2.self
          }
        ]
      },
      csqs: {
        csq: []
      }
    }
    // voice
    if (voiceInfo.csqRefUrl) {
      teamBody.csqs.csq.push({
        '@name': 'Voice_' + userId,
        refURL: voiceInfo.csqRefUrl
      })
    }
    // chat
    if (chatInfo.csqRefUrl) {
      teamBody.csqs.csq.push({
        '@name': 'Chat_' + userId,
        refURL: chatInfo.csqRefUrl
      })
    }
    // email
    if (emailInfo.csqRefUrl) {
      teamBody.csqs.csq.push({
        '@name': 'Email_' + userId,
        refURL: emailInfo.csqRefUrl
      })
    }
    // outbound
    if (outboundInfo.csqRefUrl) {
      teamBody.csqs.csq.push({
        '@name': 'Outbound_' + userId,
        refURL: outboundInfo.csqRefUrl
      })
    }

    // console.log(JSON.stringify(teamBody, null, 2))
    teamInfo = await findOrCreateTeam(teams, teamBody)
    console.log('successfully created team', teamBody.teamname)
    markProvision(userId, {$set: {team: true}})
  } catch (e) {
    console.error('failed to get team info:', e.message)
  }

  // create support email address
  try {
    await createEmail('support_' + userId)
    console.log('successfully created support email support_' + userId)
    markProvision(userId, {$set: {emailAddress: true}})
  } catch (e) {
    console.log('failed to create support email support_' + userId, e.message)
  }

  // find or create a calendar for rick to manage
  try {
    console.log('looking for existing calendar', calendarName, '...')
    // get list of existing calendars
    const calendars = await uccx.calendar.list()
    // find existing calendar matching expected name
    const calendar = calendars.find(v => v.name === calendarName)

    if (calendar) {
      // found calendar
      console.log('found existing calendar', calendarName)
      // get calendar ID
      calendarId = calendar.calId
    } else {
      // calendar not found - create now
      console.log('creating calendar', calendarName)
      const newCalendar = await uccx.calendar.create({
        name: calendarName,
        timeZone: 'Etc/Universal',
        description: 'Holiday Calendar for user ' + userId,
        calendarType: 'FULLTIME'
      })
      console.log('successfully created calendar', calendarName)
      // get ID
      calendarId = newCalendar.split('/').pop()
    }
    markProvision(userId, {$set: {calendar: true}})
  } catch (e) {
    console.log('failed to create calendar', calendarName, e.message)
  }

  // turn on advanced supervisor capabilties for rick
  try {
    console.log('turning on advanced supervisor capabilities for', supervisorId, '...')
    await uccx.capabilities.modify(supervisorId, {
      resource: {
        // '@name': 'Rick 0020 Barrows',
        refURL: 'https://uccx1.dcloud.cisco.com/adminapi/resource/' + supervisorId
      },
      capabilityList: {
        capability: [
          'QUEUE_MGMT',
          'CALENDAR_MGMT',
          'APPLICATION_MGMT',
          'CAMPAIGN_MGMT'
        ]
      }
    })
    console.log('successfully turned on advanced supervisor capabilities for', supervisorId)
    markProvision(userId, {$set: {supervisorCapabilities: true}})
  } catch (e) {
    console.log('failed to turn on advanced supervisor capabilities for', supervisorId, e.message)
  }

  // add the new holiday calendar to the list of calendars managed by rick
  try {
    console.log('adding', calendarName, 'to', supervisorId, 'calendar capabilities...')
    await uccx.calendarCapabilities.modify(supervisorId, {
      "resource": {
        "refURL": "https://uccx1.dcloud.cisco.com/adminapi/resource/" + supervisorId
      },
      "calendarList": {
        "calendar": [
          {
            "@name": calendarName,
            "refURL": "https://uccx1.dcloud.cisco.com/adminapi/calendar/" + calendarId
          }
        ]
      }
    })
    console.log('successfully added', calendarName, 'to', supervisorId, 'calendar capabilities')
    markProvision(userId, {$set: {calendarCapabilities: true}})
  } catch (e) {
    console.log('failed to add', calendarName, 'to' + supervisorId, 'calendar capabilities', e.message)
  }

  // create an Application for the user, for Rick to manage
  try {
    // build application body with calendar ID
    const applicationBody = applicationTemplate({
      id: '2' + userId,
      name: applicationName,
      calendarId
    })
    // go
    try {
      // try to get application
      console.log('looking for existing IVR Application', applicationName, '...')
      const application = await uccx.application.get(applicationName)
      // application exists
      console.log('IVR Application', applicationName, 'found. Resetting configuration...')
      // overwrite application config
      await uccx.application.modify(applicationName, applicationBody)
      console.log('IVR Application', applicationName, 'reset to standard configuration.')
    } catch (e) {
      // could not get application. assume it does not exist and try to create it.
      console.log('IVR Application', applicationName, 'not found. Creating now...')
      await uccx.application.create(applicationBody)
      console.log('successfully created IVR Application', applicationName)
    }
    markProvision(userId, {$set: {ivrApplication: true}})
  } catch (e) {
    console.log('failed to create IVR Application', applicationName, ':', e.message)
  }

  // find or create trigger for user application
  try {
    try {
      // try to find existing trigger
      await uccx.trigger.get(applicationTrigger)
      // found
      console.log('found existing application Trigger', applicationTrigger)
    } catch (e) {
      // not found
      console.log('creating applicatin Trigger', applicationTrigger, '...')
      const triggerBody = triggerTemplate({
        directoryNumber: applicationTrigger,
        deviceName: applicationTrigger,
        description: applicationName,
        applicationName,
        applicationRefUrl: 'https://uccx1.dcloud.cisco.com/adminapi/application/' + applicationName
      })
      await uccx.trigger.create(triggerBody)
      console.log('successfully created Trigger', applicationTrigger)
    }
    markProvision(userId, {$set: {applicationTrigger: true}})
  } catch (e) {
    console.log('failed to create Trigger', applicationTrigger, ':', e.message)
  }

  // set the new IVR Application as the list of calendars managed by rick
  try {
    console.log('adding', applicationName, 'to', supervisorId, 'application capabilities...')
    await uccx.applicationCapabilities.modify(supervisorId, {
      "resource": {
        "refURL": "https://uccx1.dcloud.cisco.com/adminapi/resource/" + supervisorId
      },
      "applicationList": {
        "application": [
          {
            "@name": applicationName,
            "refURL": "https://uccx1.dcloud.cisco.com/adminapi/application/" + applicationName
          }
        ]
      }
    })
    console.log('successfully added', applicationName, 'to', supervisorId, 'application capabilities')
    markProvision(userId, {$set: {applicationCapabilities: true}})
  } catch (e) {
    console.log('failed to add', applicationName, 'to' + supervisorId, 'application capabilities', e.message)
  }

  // enable outbound CSQ for outbound
  try {
    console.log('enabling outbound on Outbound_' + userId + ' CSQ...')
    // get current outbound config
    const response = await uccx.outbound.get()
    // extract the config object from the single-value array
    const currentConfig = response
    const obData = {
      "csqNameUriPair": {
        "@name": 'Outbound_' + userId,
        "refURL": outboundInfo.csqRefUrl
      },
      "percentage": 100
    }
    // is there already at least 1 CSQ?
    if (currentConfig.assignedCSQs.csq) {
      // is there at least 2 CSQs?
      if (Array.isArray(currentConfig.assignedCSQs.csq)) {
        // 2+ CSQs
        // push outbound CSQ onto the array of CSQs enabled for outbound
        currentConfig.assignedCSQs.csq.push(obData)
      } else {
        // 1 CSQ
        const arr = [currentConfig.assignedCSQs.csq]
        // push outbound CSQ onto the array of CSQs enabled for outbound
        arr.push(obData)
        // set CSQ to array
        currentConfig.assignedCSQs.csq = arr
      }
    } else {
      // no CSQs - add as object
      currentConfig.assignedCSQs.csq = obData
    }

    // update the outbound config on the server
    await uccx.outbound.modify(currentConfig)
    console.log('successfully enabled outbound on Outbound_' + userId, 'CSQ')
    markProvision(userId, {$set: {outboundCsq: true}})
  } catch (e) {
    console.log('failed to enable outbound on Outbound_' + userId, ':', e.message)
  }

  // create preview outbound campaign
  try {
    console.log('looking for existing outbound agent campaign', agentCampaignName, '...')
    // list all campaigns
    const campaigns = await uccx.campaign.list()
    // try to find rick's preview campaign
    const campaign = campaigns.find(v => v.campaignName === agentCampaignName)
    if (campaign) {
      // found
      agentCampaignId = campaign.campaignId
      console.log('found existing outbound agent campaign', agentCampaignName, 'with ID', agentCampaignId)
    } else {
      // not found
      console.log('outbound agent campaign', agentCampaignName, 'not found. creating it...')
      const response = await uccx.campaign.create(campaignTemplate({
        name: agentCampaignName,
        csqRefUrl: outboundInfo.csqRefUrl
      }))
      agentCampaignId = response.split('/').pop()
      console.log('successfully created outbound agent campaign', agentCampaignName, 'CSQ')
    }
    markProvision(userId, {$set: {outboundCampaign: true}})
  } catch (e) {
    console.log('failed to create outbound agent campaign', agentCampaignName, ':', e.message)
  }

  // find or create trigger for outbound IVR campaign
  // try {
  //   try {
  //     // try to find existing trigger
  //     await uccx.trigger.get(ivrTrigger)
  //     // found
  //     console.log('found existing outbound IVR Trigger', ivrTrigger)
  //   } catch (e) {
  //     // not found
  //     console.log('creating outbound IVR Trigger', ivrTrigger, '...')
  //     const triggerBody = triggerTemplate({
  //       directoryNumber: ivrTrigger,
  //       deviceName: 'OBC' + userId,
  //       description: 'Outbound IVR Campaign for ' + userId
  //     })
  //     await uccx.trigger.create(triggerBody)
  //     console.log('successfully created Trigger', ivrTrigger)
  //   }
  // } catch (e) {
  //   console.log('failed to create Trigger', ivrTrigger, ':', e.message)
  // }

  // find or create outbound IVR campaign
  // try {
  //   console.log('looking for existing outbound IVR campaign', ivrCampaignName, '...')
  //   // list all campaigns
  //   const campaigns = await uccx.campaign.list()
  //   // try to find rick's preview campaign
  //   const campaign = campaigns.find(v => v.campaignName === ivrCampaignName)
  //   if (campaign) {
  //     // found
  //     ivrCampaignId = campaign.campaignId
  //     console.log('found existing outbound IVR campaign', ivrCampaignName, 'with ID', ivrCampaignId)
  //   } else {
  //     // not found
  //     console.log('outbound IVR campaign', ivrCampaignName, 'not found. creating it...')
  //     const response = await uccx.campaign.create(ivrCampaignTemplate({
  //       name: ivrCampaignName,
  //       csqRefUrl: outboundInfo.csqRefUrl
  //     }))
  //     ivrCampaignId = response.split('/').pop()
  //     console.log('successfully created outbound IVR campaign', ivrCampaignName, 'CSQ')
  //   }
  // } catch (e) {
  //   console.log('failed to create outbound IVR campaign', ivrCampaignName, ':', e.message)
  // }

  // add the new preview outbound campaign to the list of campaigns managed by rick
  try {
    console.log('adding', agentCampaignName, 'to', supervisorId, 'campaign capabilities...')
    await uccx.campaignCapabilities.modify(supervisorId, {
      "resource": {
        "refURL": "https://uccx1.dcloud.cisco.com/adminapi/resource/" + supervisorId
      },
      "campaignList": {
        "campaign": [
          {
            "@name": agentCampaignName,
            "refURL": "https://uccx1.dcloud.cisco.com/adminapi/campaign/" + agentCampaignId
          }
          // {
          //   "@name": ivrCampaignName,
          //   "refURL": "https://uccx1.dcloud.cisco.com/adminapi/campaign/" + ivrCampaignId
          // }
        ]
      }
    })
    console.log('successfully added', agentCampaignName, 'to', supervisorId, 'campaign capabilities')
    markProvision(userId, {$set: {campaignCapabilities: true}})
  } catch (e) {
    console.log('failed to add', agentCampaignName, 'to', supervisorId, 'campaign capabilities', ':', e.message)
  }

  markProvision(userId, {$set: {status: 'complete'}})

  return {
    chatInfo,
    widgetInfo,
    emailInfo,
    voiceInfo,
    outboundInfo,
    teamInfo
  }
}

module.exports = provision