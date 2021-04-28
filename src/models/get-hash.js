const crypto = require('crypto')

// create hash of user sub, and append it to the first 8 characters of the user sub
function getHash (email) {
  // create hash of user sub, and append it to the first 8 characters of the user sub
  // for cisco.com email addresses, just use the part before the @
  const parts = email.split('@')
  if (parts[1] === 'cisco.com') {
    return parts[0]
  }
  // for all other non-cisco users, generate a hash based on their email
  // with a max length of 14 characters
  const hash = crypto
  .createHash('shake128', {outputLength: 6})
  .update(email, 'utf-8')
  .digest('base64')
  // remove any characters that are not letters, numbers, or underscores
  .replace(/\W/g, '')
  return email.split('@').shift().slice(0, 8) + hash
}

module.exports = getHash