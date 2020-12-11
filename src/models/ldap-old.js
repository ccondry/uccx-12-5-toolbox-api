const ldapClient = require('simple-ldap-client')

// set up ldap client
const ldap = new ldapClient(process.env.LDAP_URL, process.env.LDAP_BASE_DN)

const attributes = [
  'objectGUID',
  'name',
  'sAMAccountName',
  'cn',
  'memberOf',
  'primaryGroupID',
  'description',
  'distinguishedName',
  'mail',
  'userPrincipalName',
  'whenChanged',
  'whenCreated',
  'givenName',
  'sn',
  'telephoneNumber',
  'userAccountControl',
  'accountExpires',
  'lastLogonTimestamp'
]

async function deleteUser (cn) {
  // console.log('delete user', cn)
  try {
    const params = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      userDn: `CN=${cn},${process.env.LDAP_BASE_DN}`
      // userDn: username
    }
    await ldap.deleteUser(params)
  } catch (error) {
    console.log('failed to delete LDAP user:', error.message)
    throw error
  }
}

async function disableUser (username) {
  try {
    const params = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      username
    }
    await ldap.disableUser(params)
  } catch (error) {
    console.log('failed to disable LDAP user:', error.message)
    throw error
  }
}

async function enableUser (username) {
  try {
    const params = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      username
    }
    await ldap.enableUser(params)
  } catch (error) {
    console.log('failed to enable LDAP user:', error.message)
    throw error
  }
}

async function listUsers ({
  filter = '(&(objectClass=user)(objectcategory=person))'
}) {
  return ldap.listUsers({
    adminDn: process.env.LDAP_ADMIN_DN,
    adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    filter,
    attributes,
    searchDn: process.env.LDAP_BASE_DN
  })
}

async function addToGroup ({userDn, username, groupDn}) {
  try {
    await ldap.addToGroup({
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      userDn,
      username,
      groupDn
    })
    // done
    return
  } catch (error) {
    // failed
    // console.log('failed to add LDAP user', userDn, 'to group', groupDn, ':', error.message)
    throw error
  }
}

async function removeFromGroup ({userDn, username, groupDn}) {
  try {
    await ldap.removeFromGroup({
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      userDn,
      username,
      groupDn
    })
    // done
    return
  } catch (rejectMessage) {
    // failed
    // console.log('failed to remove LDAP user', userDn, 'from group', groupDn, ':', error.message)
    throw Error(rejectMessage)
  }
}

async function getUser (username) {
  // console.log('request to get user', username)
  // const domain = process.env.LDAP_DOMAIN
  // const upn = username + '@' + domain

  try {
    // console.log('running ldap.adminGetUser...')
    const user = await ldap.adminGetUser({
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
      username,
      attributes
    })
    return user
  } catch (e) {
    // failed
    // console.log('failed to get LDAP user', username, e.message)
    throw new Error('failed to get LDAP user ' + username + ':' + e.message)
  }
}

async function resetPassword (body) {
  try {
    if (!body.newPassword) {
      const error = 'newPassword is required to reset a password'
      // console.log(error)
      throw new Error(error)
    }
    if (
      (!body.userDn || body.userDn === '') &&
      (!body.upn || body.upn === '') &&
      (!body.username || body.username === '') &&
      (!body.email || body.email === '')
    ) {
      const error = 'userDn, upn, username, or email is required to reset a password'
      // console.log(error)
      throw new Error(error)
    }
    const adminCreds = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    }
    // mix in credentials with user request data, and send request
    let params = Object.assign({}, adminCreds, body)
    await ldap.resetPassword(params)
    // console.log('password reset successfully for ' + user)
    return
  } catch (error) {
    // ... erroror checks
    // console.log(error)
    throw new Error(error)
  }
}

async function changePassword (body) {
  // console.log('password change request received for username ' + body.username)
  try {
    await ldap.changePassword({
      username: body.username,
      newPassword: body.newPassword,
      oldPassword: body.oldPassword
    })

    // console.log('password change successful for username ' + body.username)
    return
  } catch (error) {
    // console.log(error)
    throw new Error(error)
  }
}

function _createUser (adminCreds, dn, body) {
  return new Promise((resolve, reject) => {
    // create client connection
    const client = ldap.getClient()
    // catch LDAP connection errors
    client.on('connectError', function (err) {
      reject(err)
    })
    // login to LDAP
    client.bind(adminCreds.adminDn, adminCreds.adminPassword, (err) => {
      if (err) {
        client.destroy()
        return reject(err)
      }
      body.objectClass = body.objectClass || ["top", "person", "organizationalPerson", "user"]
      // create new user
      client.add(dn, body, (err2, user) => {
        client.destroy()
        if (err2) reject(err2)
        resolve(user)
      })
    })
  })
}

async function createUser (dn, body, newPassword) {
  // console.log('creating LDAP user', dn, body)
  const username = body.sAMAccountName
  try {
    // console.log('creating new LDAP user', body.username, '...')
    const adminCreds = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD
    }

    // create the user
    try {
      await _createUser(adminCreds, dn, body)
    } catch (e) {
      if (e.message.includes('ENTRY_EXISTS')) {
        // continue if ldap account exists
      } else {
        throw e
      }
    }
    // set new user password
    try {
      await ldap.resetPassword({...adminCreds, username, newPassword})
    } catch (e) {
      // invalid password
      // delete the account we just created and throw an error to user
      await ldap.deleteUser({...adminCreds, userDn: dn})
      throw Error(`Your new password doesn't meet the minimum requirements. Try another password.`)
    }
    // enable new user
    await ldap.enableUser({...adminCreds, username})
    // set new user expiration to 12 hours from now
    const nowUtc = Date.now()
    const expiresUtc = nowUtc + 12 * 60 * 60 * 1000
    const accountExpires = (10000 * expiresUtc) + 116444736000000000
    // update user accountExpires attribute
    await changeUser({
      username,
      operation: 'replace',
      modification: {
        accountExpires
      }
    })
    // add user to the Active group
    // user is being extended 
    try {
      await addToGroup({
        userDn: dn,
        groupDn: process.env.LDAP_ACTIVE_GROUP_DN
      })
    } catch (e) {
      if (e.message.match(/DSID-031A11C4/)) {
        // ignore user already in group error
      } else {
        // throw other errors
        throw e
      }
    }
    return
  } catch (error) {
    // console.log('failed to create LDAP user:', error.message)
    throw error
  }
}

async function changeUser ({username, operation, modification}) {
  // set up changes we want to make to the user
  const change = new ldap.ldapjs.Change({
    operation,
    modification
  })

  return ldap.changeUser({
    adminDn: process.env.LDAP_ADMIN_DN,
    adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    username,
    changes: [change]
  })
}

module.exports = {
  getUser,
  resetPassword,
  changePassword,
  createUser,
  addToGroup,
  removeFromGroup,
  listUsers,
  enableUser,
  disableUser,
  deleteUser,
  client: ldap,
  changeUser
}
