const createOrGetLine = require('./line')
const validate = require('./validate')

// validate .env vars
validate([
  'ROUTE_PARTITION',
  'CTI_USER',
  // 'VIRTUAL_DN_PREFIX',
  'CALLING_SEARCH_SPACE',
  'DEVICE_POOL'
])

// provision a jabber agent phone for a user
module.exports = {
  create: createAgentPhone
}

async function createAgentPhone(axl, {
  pattern,
  username,
  alertingName = '',
  routePartitionName = process.env.ROUTE_PARTITION,
  ctiUser = process.env.CTI_USER,
  name
}) {
  // validate input
  if (!pattern || !pattern.length === 8) {
    throw '"pattern" must be provided and be an 8 digit numerical string'
  }
  // create phone parameters
  // device name cannot exceed 15 characters
  if (!name || !name.length) {
    // set default name
    name = (process.env.JABBER_DEVICE_NAME_PREFIX || 'CSF') + username.toUpperCase()
  }
  const description = `${username} Jabber ${pattern}`

  // make sure the device is not already created
  let error
  try {
    console.log(`checking if device ${name} already exists`)
    // device exists
    const results = await axl.getPhone({name})
    console.log(`device ${name} already exists`)
    // return the existing phone
    return results
  } catch (e) {
    // device does not exist - continue
    console.log(`device ${name} does not exist. continuing.`)
  }

  // get or create the line UUID
  const lineUuid = await createOrGetLine(axl, {
    pattern,
    routePartitionName,
    alertingName,
    description
  })

  // create the phone device
  try {
    console.log(`creating phone device ${name}`)
    const addPhoneResults = await axl.addPhone({
      name,
      description,
      product: 'Cisco Unified Client Services Framework',
      class: 'Phone',
      protocol: 'SIP',
      protocolSide: 'User',
      devicePoolName: process.env.DEVICE_POOL,
      phoneButtonTemplateName: 'Standard Client Services Framework',
      commonPhoneConfigName: 'Standard Common Phone Profile',
      locationName: 'Hub_None',
      // useDevicePoolCgpnTransformCss: 'true',
      ownerUserName: username,
      presenceGroupName: 'Standard Presence group',
      callingSearchSpaceName: process.env.CALLING_SEARCH_SPACE,
      // rerouteCallingSearchSpaceName: process.env.CALLING_SEARCH_SPACE,
      // enableCallRoutingToRdWhenNoneIsActive: 'true',
      deviceSecurityProfile: 'Cisco Unified Client Services Framework - Standard SIP Non-Secure Profile',
      sipProfile: 'Standard SIP Profile',
      lines: [{
        line: {
          index: 1,
          dirn: {
            '$': {
              uuid: lineUuid
            }
          },
          associatedEndusers: [{
            enduser: {
              userId: username
            }
          }],
          maxNumcalls: 2,
          busyTrigger: 1
        }
      }]
    })
    // extract device UUID
    deviceUuid = addPhoneResults.slice(1, addPhoneResults.length - 1)
  } catch (e) {
    console.error('failed to create phone device', e)
    throw e
  }
  // device complete
  // now associate the device with the app user, for CTI control of device
  try {
    await axl.associateDeviceWithApplicationUser(deviceUuid.toLowerCase(), ctiUser)
  } catch (e) {
    throw e
  }

  // associate the device with the end user
  try {
    await axl.associateDeviceWithEndUser(deviceUuid.toLowerCase(), username)
  } catch (e) {
    throw e
  }

}
