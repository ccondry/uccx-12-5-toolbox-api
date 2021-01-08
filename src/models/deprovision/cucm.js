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

  // filter phones to just the provision generated ones for this user
  const filteredLines = lines.filter(line => {
    const pattern = line.pattern
    // line pattern should be 8 characters
    // 10800325
    if (pattern.length !== 8) {
      console.log('skip', pattern)
      return false
    }
    const prefix = pattern.substring(0, 4)
    const prefixes = ['1080', '1081', '1082']
    // const suffix = pattern.substring(4)

    if (!prefixes.includes(prefix)) {
      console.log('skip', pattern)
      return false
    }

    // match phone number suffix to user ID
    const suffix = pattern.substring(4)
    if (suffix !== String(user.id)) {
      return false
    }

    return true
  })

  // delete phones
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
    const name = phone.name

    // phone name should be 15 characters
    // CSFRBARROWS0000
    if (name.length !== 15) {
      console.log('skip', name)
      return false
    }

    // const prefix = name.substring(0, 11)
    const suffix = name.substring(12)

    // return true if suffix is a number and matches user's 4-digit ID
    if (isNaN(suffix) || suffix !== String(user.id)) {
      console.log('skip', name)
      return false
    } else {
      return true
    }
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
  deleteJabberLines
}
