const ldap = require('../../ldap')

module.exports = async function (user) {
  // const skipped = []
  const ldapUsers = await ldap.listUsers({
    searchDn: process.env.LDAP_USER_AGENTS_DN
  })
  // console.log('successfully got', ldapUsers.length, 'ldap users in', process.env.LDAP_USER_AGENTS_DN)
  // console.log('ldapUsers', ldapUsers)
  // filter users to the ones we want to delete
  const users = ldapUsers.filter(u => {
    const username = u.sAMAccountName

    // check username prefix
    const prefixes = ['sjeffers', 'rbarrows', 'jopeters', 'hliang', 'jabracks']

    // true if matches like sjeffers0325
    for (const prefix of prefixes) {
      if (username === prefix + user.id) {
        return true
      }
    }

    // otherwise excluded
    return false
  })

  const {success, failed} = await ldap.deleteUsers(users)
  
  // return results
  return {
    success,
    failed
    // skipped
  }
}
