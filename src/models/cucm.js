const cucmAxl = require('cucm-axl')
const validate = require('./validate')

validate([
  'AXL_HOST',
  'AXL_USER',
  'AXL_PASS',
  'AXL_VERSION'
])

const axl = new cucmAxl({
  host: process.env.AXL_HOST,
  user: process.env.AXL_USER,
  pass: process.env.AXL_PASS,
  version: process.env.AXL_VERSION
})

module.exports = axl
