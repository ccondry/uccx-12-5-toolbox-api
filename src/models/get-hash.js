const crypto = require('crypto')

// create hash of user sub, and append it to the first 8 characters of the user sub
function getHash (sub) {
  const hash = crypto
  .createHash('shake128', {outputLength: 6})
  .update(sub, 'utf-8')
  .digest('base64')
  // remove any characters that are not letters, numbers, or underscores
  .replace(/\W/g, '')
  return sub.split('@').shift().slice(0, 8) + hash
}

module.exports = getHash