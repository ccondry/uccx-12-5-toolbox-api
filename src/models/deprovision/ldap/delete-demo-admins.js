const ldap = require('../../ldap')
const getHash = require('../../get-hash')

module.exports = async function (user) {
  // debug
  console.log('delete-demo-admins user =', user)
  // const skipped = []
  const ldapUsers = await ldap.listUsers({
    searchDn: process.env.LDAP_LAB_USERS_DN
  })
  console.log('successfully got', ldapUsers.length, 'ldap users in', process.env.LDAP_LAB_USERS_DN)

  // find the ldap account matching input user
  const users = ldapUsers.filter(u => u.sAMAccountName === user.username)
  // console.log('deleting ldap vpn users:', users)
  const {success, failed} = await ldap.deleteUsers(users)
  // return results
  return {
    success,
    failed
    // skipped
  }
}
