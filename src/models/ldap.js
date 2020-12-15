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
  addToGroup
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
  const domain = process.env.LDAP_DOMAIN
  // console.log('request to add LDAP user', userDn, 'to group', groupDn)
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

async function resetPassword (req, res) {
  try {
    if (!req.body.newPassword) {
      const error = 'newPassword is required to reset a password'
      console.log(error)
      return res.status(500).send({error})
    }
    if (
      (!req.body.userDn || req.body.userDn === '') &&
      (!req.body.upn || req.body.upn === '') &&
      (!req.body.username || req.body.username === '') &&
      (!req.body.email || req.body.email === '')
    ) {
      const error = 'userDn, upn, username, or email is required to reset a password'
      console.log(error)
      return res.status(500).send({error})
    }
    const user = req.body.userDn || req.body.email || req.body.username || req.body.email
    console.log('password reset request received for ' + user)

    const adminCreds = {
      adminDn: process.env.LDAP_ADMIN_DN,
      adminPassword: process.env.LDAP_ADMIN_PASSWORD,
    }
    // mix in credentials with user request data, and send request
    let params = Object.assign({}, adminCreds, req.body)
    await ldap.resetPassword(params)
    console.log('password reset successfully for ' + user)
    return res.status(200).send()
  } catch (error) {
    // ... erroror checks
    console.log(error)
    return res.status(500).send({error})
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
        // console.log('LDAP user already exists. continuing.')
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
