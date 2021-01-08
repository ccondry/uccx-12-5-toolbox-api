const cucm = require('../cucm')

async function listPhones ({
  criteria = {name: 'CSF%'},
  details = [
    'name',
    'description'
  ]
}) {
  return cucm.listPhones(criteria, details)
}

async function listLines ({
  criteria = {
    pattern: '108%',
    routePartitionName: process.env.ROUTE_PARTITION
  },
  details = [
    'pattern',
    'description'
  ]
}) {
  return cucm.listLines(criteria, details)
}

async function deleteJabberLines (user) {
  const success = []
  const fail = []
  // find all CSF lines
  let lines
  try {
    lines = await listLines({})
  } catch (e) {
    throw e
  }

  // valid prefixes for our agents
  const validPrefixes = ['1080', '1081', '1082', '1083', '1084']

  // filter phones to just the provision generated ones
  const filteredLines = lines.filter(line => {
    // prefix for the current line
    const prefix = line.pattern.substring(0, 4)
    // return true (include) if line pattern is like 10810325
    for (const v of validPrefixes) {
      if (line.pattern === `${v}${user.id}`) {
        return true
      }
    }
    // filter out if it didn't match our list of expected patterns
    return false
  })

  // delete lines
  for (const line of filteredLines) {
    try {
      await cucm.removeLine({
        pattern: line.pattern,
        routePartitionName: process.env.ROUTE_PARTITION
      })
      console.log('successfully deleted CUCM line', line.pattern)
      success.push(line.pattern)
    } catch (e) {
      fail.push(line.pattern)
    }
  }
  return {
    success,
    fail
  }
}

async function deleteJabberPhones (user) {
  const success = []
  const fail = []
  
  // find all CSF devices
  let phones
  try {
    phones = await listPhones({})
  } catch (e) {
    throw e
  }

  // filter phones to just the provision generated ones
  const filteredPhones = phones.filter(phone => {
    // list of agents with a jabber phone
    const agents = ['rbarrows', 'sjeffers', 'jopeters', 'hliang', 'jabracks']
    // return true (include) if phone name is like CSFRBARROWS0325
    for (const agent of agents) {
      if (phone.name === `CSF${agent.toUpperCase()}${user.id}`) {
        return true
      }
    }
    // filter out if it didn't match our list of expected names
    return false
  })

  // delete phones
  for (const phone of filteredPhones) {
    try {
      await cucm.removePhone({name: phone.name})
      console.log('successfully deleted CUCM phone', phone.name)
      success.push(phone.name)
    } catch (e) {
      fail.push(phone.name)
      // throw e
    }
  }
  return {
    success,
    fail
  }
}

module.exports = {
  listPhones,
  listLines,
  deleteJabberPhones,
  deleteJabberLines,
  lib: cucm
}
