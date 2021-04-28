const ldapClient = require('simple-ldap-client')
const validate = require('./validate')

// validate .env vars
validate([
  'LDAP_URL',
  'LDAP_DOMAIN',
  'LDAP_BASE_DN',
  'LDAP_ADMIN_PASSWORD',
  'LDAP_ADMIN_DN'
  // 'ldap_admin_group_dn'
])

// set up ldap client
const ldap = new ldapClient(process.env.LDAP_URL, process.env.LDAP_BASE_DN)

const attributes = [
  'objectGUID',
  'name',
  'sAMAccountName',
  'memberOf',
  'primaryGroupID',
  'description',
  'physicalDeliveryOfficeName',
  'distinguishedName',
  'mail',
  'userPrincipalName',
  'whenChanged',
  'whenCreated',
  'givenName',
  'sn',
  'telephoneNumber',
  'userAccountControl'
]

module.exports = {
  // su,
  getUser,
  resetPassword,
  changePassword,
  createUser,
  addToGroup,
  listUsers,
  deleteUsers
}

function getUser (username) {
  // console.log('request to get user', username)
  const domain = process.env.LDAP_DOMAIN
  const upn = username + '@' + domain

  return ldap.adminGetUser({
    adminDn: process.env.LDAP_ADMIN_DN,
    adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    upn,
    attributes
  })
}

function addToGroup ({groupDn, userDn}) {
  // console.log('request to add LDAP user', userDn, 'to group', groupDn)
  // const domain = process.env.LDAP_DOMAIN
  return ldap.addToGroup({
    adminDn: process.env.LDAP_ADMIN_DN,
    adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    userDn,
    groupDn
  })
}

// async function getUser (req, res) {
//   console.log('get user request for username' + req.body.username)
//   const username = req.body.username
//   const password = req.body.password
//   const domain = process.env.LDAP_DOMAIN
//   const upn = username + '@' + domain
//   try {
//     // attempt authentication with LDAP
//     await ldap.authenticate({
//       upn,
//       password
//     })
//   } catch (error) {
//     // console.log(util.inspect(err, null, false))
//     // console.log(err.lde_message)
//     // console.log(JSON.parse(err.lde_message).comment)
//     // if (error.lde_message && error.lde_message.includes('DSID-0C0903C5')) {
//     if (error.name === 'InvalidCredentialsError') {
//       // invalid credentials
//       error.description = 'Invalid Credentials'
//       console.log(`${username} supplied invalid credentials`)
//       return res.status(401).send({error})
//     } else {
//       // some other error
//       // console.log(`${username} login failed`, JSON.stringify(error, 2, null))
//       console.log(`${username} login failed`, error)
//       // console.log(`${username} login failed`, JSON.parse(JSON.stringify(error)))
//       return res.status(500).send({error})
//     }
//   }
//   // authentication done, now send token
//   console.log('authentication successful for username ' + req.body.username)
//
//   try {
//     console.log('retrieving user details for JWT payload')
//     // const attributes = ['objectGUID', 'name', 'sAMAccountName', 'memberOf', 'primaryGroupID', 'description', 'physicalDeliveryOfficeName', 'distinguishedName', 'mail', 'userPrincipalName', 'whenChanged', 'whenCreated', 'givenName', 'sn']
//     const user = await ldap.getUser({
//       upn,
//       password,
//       attributes
//     })
//     console.log('authenticated user: ', user.dn)
//     let admin = false
//     try {
//       // check if user is a member of the Domain Admins group to determine if they are an admin
//       admin = user.memberOf.includes(process.env.ldap_admin_group_dn)
//     } catch (e) {}
//
//     let id = ''
//     try {
//       id = user.physicalDeliveryOfficeName
//     } catch (e) {}
//
//     // create JWT payload
//     const payload = {
//       username,
//       name: user.name,
//       givenName: user.givenName,
//       sn: user.sn,
//       id,
//       upn,
//       domain: user.domain,
//       admin,
//       email: user.mail,
//       telephoneNumber: user.telephoneNumber
//     }
//     // create JWT token
//     const token = await jwtAuth.createToken(payload)
//     console.log('returning jwt')
//     // respond OK with token
//     return res.status(200).send({ results: { token } })
//   } catch (error) {
//     console.log(error)
//     // failed to generate token
//     // some other error
//     return res.status(500).send({error})
//   }
// }

async function resetPassword (body) {
  try {
    if (!body.newPassword) {
      const error = 'newPassword is required to reset a password'
      throw Error(error)
    }
    if (
      (!body.userDn || body.userDn === '') &&
      (!body.upn || body.upn === '') &&
      (!body.username || body.username === '') &&
      (!body.email || body.email === '')
    ) {
      const error = 'userDn, upn, username, or email is required to reset a password'
      throw Error(error)
    }
    const user = body.userDn || body.email || body.username || body.email

    const adminCreds = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    }
    // mix in credentials with user request data, and send request
    let params = Object.assign({}, adminCreds, body)
    await ldap.resetPassword(params)
    return
  } catch (e) {
    throw e
  }
}

async function changePassword (req, res) {
  console.log('password change request received for username ' + req.body.username)
  try {
    await ldap.changePassword({
      username: req.body.username,
      newPassword: req.body.newPassword,
      oldPassword: req.body.oldPassword
    })

    console.log('password change successful for username ' + req.body.username)
    res.status(200).send()
  } catch (error) {
    console.log(error)
    res.status(500).send({error})
  }
}

async function createUser (body) {
  try {
    // console.log('creating LDAP user...')
    const adminCreds = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD
    }
    // mix in credentials with user request data, and send request
    let params = Object.assign({}, adminCreds, body)
    // remove any undefined or empty string values
    const keys = Object.keys(params)
    for (const key of keys) {
      if (typeof params[key] === 'undefined' || params[key].length === 0) {
        delete params[key]
      }
    }
    // console.log('creating new LDAP user...')
    // create the user
    try {
      await ldap.createUser(params)
      console.log('successfully created new LDAP user')
    } catch (e) {
      if (e.message.includes('ENTRY_EXISTS')) {
        // continue if ldap account exists
        console.log(`LDAP user ${params.username} already exists in ${params.usersDn}. continuing...`)
      } else {
        throw e
      }
    }
    console.log('resetting the LDAP user password...')
    params.newPassword = params.password
    await ldap.resetPassword(params)
    console.log('successfully reset password for LDAP user. enabling user account...')
    await ldap.enableUser(params)
    console.log('successfully enabled LDAP user account. done creating user.')
  } catch (error) {
    console.log('failed to create LDAP user:', error.message)
    throw error
  }
}

async function listUsers ({
  attributes = [
    'name',
    'sAMAccountName',
    'memberOf',
    'primaryGroupID',
    'description',
    'physicalDeliveryOfficeName',
    'distinguishedName',
    'mail',
    'userPrincipalName',
    'whenChanged',
    'whenCreated'
  ],
  filter = '(&(objectClass=user)(objectcategory=person))',
  searchDn
}) {
  const ldapUsers = await ldap.listUsers({
    adminDn: process.env.LDAP_ADMIN_DN,
    adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    filter,
    attributes,
    searchDn
  })
  // return results
  return ldapUsers
}

async function deleteUsers (users) {
  const success = []
  const failed = []
  for (const user of users) {
    const username = user.sAMAccountName
    // console.log('deleting LDAP user', username, '...')
    try {
      await ldap.deleteUser({
        adminDn: process.env.LDAP_ADMIN_DN,
        adminPassword: process.env.LDAP_ADMIN_PASSWORD,
        userDn: user.distinguishedName
      })
      console.log('successfully deleted LDAP user', username)
      // add to list of deleted users
      success.push(username)
      continue
    } catch (e) {
      console.log('failed to delete LDAP user', username, e.message)
      failed.push(username)
      continue
    }
  }
  // return results
  return {
    success,
    failed
  }
}
