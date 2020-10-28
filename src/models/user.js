const ldap = require('./ldap')
const cms = require('./cms')

// modify user object return data
function modUser (user) {
  if (!user) {
    return user
  }
  // append enabled boolean from userAccountControl data
  const enabled = (user.userAccountControl & 2) != 2
  // append admin boolean
  // let admin
  // try {
  //   admin = user.memberOf.includes(process.env.LDAP_ADMIN_GROUP_DN)
  // } catch (e) {
  //   admin = false
  // }
  // append fullName
  const fullName = user.givenName + ' ' + user.sn

  return {
    ...user,
    fullName,
    enabled
  }
}

// get one LDAP user
async function get (username) {
  try {
    const user = await ldap.getUser(username)
    return modUser(user)
  } catch (e) {
    throw e
  }
}

module.exports = {
  get,
  // list all LDAP users
  async list (query = {}) {
    try {
      const users = await ldap.listUsers(query)
      return users.map(modUser)
    } catch (e) {
      throw e
    }
  },
  async delete (username) {
    try {
      // get user CN
      const user = await get(username)
      // delete user from AD
      await ldap.deleteUser(user.cn)
      // start CMS LDAP sync 
      cms.sync()
    } catch (e) {
      throw e
    }
  },
  // // enable LDAP user
  // async enable (username) {
  //   return ldap.enableUser(username)
  // },
  // // disable LDAP user
  // async disable (username) {
  //   return ldap.disableUser(username)
  // },
  // create LDAP user
  async create (dn, body, password) {
    try {
      const response = await ldap.createUser(dn, body, password)
      // start CMS LDAP sync 
      cms.sync()
      return response
    } catch (e) {
      throw e
    }
  },
  // set LDAP user accountExpires time to current time + ms milliseconds
  // also puts user back into the 'active' LDAP group, if they are not in it
  async extend (username, ms) {
    // calculate time
    const nowUtc = Date.now()
    const expiresUtc = nowUtc + ms
    const accountExpires = (10000 * expiresUtc) + 116444736000000000
    // create ldap change object
    try {
      await ldap.changeUser({
        username,
        operation: 'replace',
        modification: {
          accountExpires
        }
      })

      // modify Active group to add user to it
      if (ms > 0) {
        // user is being extended 
        try {
          await ldap.addToGroup({
            username,
            groupDn: process.env.LDAP_ACTIVE_GROUP_DN
          })
          // start CMS LDAP sync 
          cms.sync()
        } catch (e) {
          // check for EntryAlreadyExistsError
          if (e.message.match(/DSID-031A11C4/)) {
            // console.log(`${username} is already in ${process.env.LDAP_BASE_DN}`)
          } else {
            throw e
          }
        }
      } else {
        // user is being expired now
        // remove them from the active group
        try {
          await ldap.removeFromGroup({
            username,
            groupDn: process.env.LDAP_ACTIVE_GROUP_DN
          })
          // start CMS LDAP sync 
          cms.sync()
        } catch (e) {
          // check for error that user is already not in the group
          if (e.message.match(/DSID-031A1236/)) {
            // console.log(`${username} is not in ${process.env.LDAP_ACTIVE_GROUP_DN}`)
          } else {
             throw e
          }
        }
      }
      
    } catch (e) {
      throw e
    }
  },
  async setPassword (username, newPassword) {
    return ldap.resetPassword({
      username,
      newPassword
    })
  }
}