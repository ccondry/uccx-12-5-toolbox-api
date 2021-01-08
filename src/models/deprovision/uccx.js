const uccx = require('../uccx')

async function deleteTriggers (user) {
  const typeName = 'UCCX triggers'
  const type = 'trigger'
  const nameProperty = 'directoryNumber'
  const idProperty = 'directoryNumber'

  const success = []
  const fail = []

  // console.log(`listing ${typeName} for ${user.username} ${user.id}...`)
  const items = await uccx[type].list()
  // console.log('found', items.length, typeName, items[0])

  // filter triggers to the one for this user
  const filtered = items.filter(item => item[nameProperty] === '2' + user.id)
  for (const item of filtered) {
    // delete!
    try {
      await uccx[type].delete(item[idProperty])
      console.log('successfully deleted', typeName, item[nameProperty])
      success.push(item[nameProperty])
    } catch (e) {
      console.log('failed to delete', typeName, item[nameProperty], e.message)
      fail.push(item[nameProperty])
    }
  }
  return {
    success,
    fail
  }
}

async function deleteCampaigns (user) {
  return deleteItems({
    user,
    typeName: 'UCCX outbound campaigns',
    type: 'campaign',
    validTypes: ['Agent'],
    idProperty: 'campaignId',
    nameProperty: 'campaignName'
  })
}

async function deleteCalendars (user) {
  return deleteItems({
    user,
    typeName: 'UCCX holiday calendars',
    type: 'calendar',
    validTypes: ['HolidayCalendar'],
    idProperty: 'calId'
  })
}

async function deleteApplications (user) {
  return deleteItems({
    user,
    typeName: 'UCCX applications',
    type: 'application',
    validTypes: ['Customer_Service'],
    nameProperty: 'applicationName',
    idProperty: 'applicationName',
    nameParts: 3
  })
}

async function deleteTeams (user) {
  return deleteItems({
    user,
    typeName: 'UCCX teams',
    type: 'team',
    validTypes: ['Cumulus', '2Ring'],
    nameProperty: 'teamname',
    idProperty: 'teamId'
  })
}

async function deleteSkills (user) {
  return deleteItems({
    user,
    typeName: 'UCCX skills',
    type: 'skill',
    validTypes: ['Chat', 'Email', 'Voice', 'Outbound'],
    nameProperty: 'skillName',
    idProperty: 'skillId'
  })
}

async function deleteCsqs (user) {
  return deleteItems({
    user,
    typeName: 'UCCX CSQs',
    type: 'csq',
    validTypes: ['Chat', 'Email', 'Voice', 'Outbound']
  })
}

async function deleteChatWidgets (user) {
  // delete chat widgets using normal REST APIs
  // return deleteItems({
  //   typeName: 'UCCX chat widgets',
  //   type: 'chatWidget',
  //   validTypes: ['Chat']
  // })
  const success = []
  const fail = []
  // get list of chat widgets from appAdmin web UI
  // console.log(`listing bubble chat widgets...`)
  const items = await uccx.appAdmin.chatWidget.list()
  // console.log('found', items.length, 'bubble chat widgets')
  const filtered = items.filter(v => v.name === `Chat_${user.id}`)
  // for each chat widget
  for (const item of filtered) {
    // delete chat widget using appAdmin web UI
    try {
      await uccx.appAdmin.chatWidget.delete(item.id)
      success.push(item.name)
      console.log('successfully deleted bubble chat widget', item.name, `(${item.id})`)
    } catch (e) {
      fail.push(item.name)
      console.log('failed to delete bubble chat widget', item.name, `(${item.id})`)
    }
  }
  
  return {
    success,
    fail
  }
}

async function deleteItems ({
  user,
  typeName,
  type,
  validTypes,
  nameProperty = 'name',
  idProperty = 'id',
  nameParts = 2
}) {
  // const skipped = []
  const success = []
  const fail = []

  // console.log(`listing ${typeName} for ${user.username} ${user.id}...`)
  const items = await uccx[type].list()
  // console.log('found', items.length, typeName, items[0])
  // console.log('found', items.length, typeName, items)

  const filtered = items.filter(item => {
    const parts = item[nameProperty].split('_')
    // valid name has 2 parts
    if (parts.length !== nameParts) {
      // skipped.push(item[nameProperty])
      return false
    }

    // check suffix - it should be a number matching user's ID
    const suffix = parts.pop()
    if (isNaN(suffix) || suffix !== String(user.id)) {
      // skipped.push(item[nameProperty])
      return false
    }

    // check prefix
    const prefix = parts.join('_')
    if (!validTypes.includes(prefix)) {
      // skipped.push(item[nameProperty])
      return false
    }

    //
    return true
  })

  // console.log('filtered', 'to', filtered.length, typeName)
  for (const item of filtered) {
    // delete!
    try {
      await uccx[type].delete(item[idProperty])
      console.log('successfully deleted', typeName, item[nameProperty])
      success.push(item[nameProperty])
    } catch (e) {
      console.log('failed to delete', typeName, item[nameProperty], e.message)
      fail.push(item[nameProperty])
    }
  }
  return {
    success,
    // skipped,
    fail
  }
}

module.exports = {
  deleteCsqs,
  deleteChatWidgets,
  deleteSkills,
  deleteTeams,
  deleteApplications,
  deleteCalendars,
  deleteTriggers,
  deleteCampaigns,
  lib: uccx
}
