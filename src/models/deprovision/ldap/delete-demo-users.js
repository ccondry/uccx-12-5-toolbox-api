const ldap = require('../../ldap')

module.exports = async function (user) {
  // const skipped = []
  // console.log(`getting ldap demo users for ${user.username} ${user.id}...`)
  const ldapUsers = await ldap.listUsers({
    searchDn: process.env.LDAP_USER_AGENTS_DN
  })
  // console.log('successfully got', ldapUsers.length, 'ldap users in', process.env.LDAP_USER_AGENTS_DN)

  // filter users to the ones we want to delete
  const users = ldapUsers.filter(u => {
    const username = u.sAMAccountName

    // check username length
    if (username.length !== 12) {
      return false
    }

    // check username prefix
    const prefix = username.substring(0, 8)
    const prefixes = ['sjeffers', 'rbarrows', 'jopeters', 'hliang', 'jabracks']
    if (!prefixes.includes(prefix)) {
      return false
    }

    // check username suffix is a number and matches the user's 4-digit ID
    const suffix = username.substring(8)
    if (isNaN(suffix) || suffix !== String(user.id)) {
      return false
    }

    // otherwise included
    return true
  })

  const {success, failed} = await ldap.deleteUsers(users)
  
  // return results
  return {
    success,
    failed
    // skipped
  }
}
