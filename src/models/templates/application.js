// get default script name from env vars, or use static default value
const defaultScript = process.env.DEFAULT_IVR_APPLICATION || 'CumulusInbound.aef'
module.exports = function ({id, calendarId, name}) {
  console.log('defaultScript is', defaultScript)
  const body = {
    id,
    type: 'Cisco Script Application',
    applicationName: name,
    description: name,
    maxsession: 5,
    ScriptApplication: {
      script: "SCRIPT[" + defaultScript + "]",
      scriptParams: []
    },
    enabled: true
  }
  // set calendar ID, if supplied in parameters
  if (calendarId) {
    body.ScriptApplication.scriptParams.push({
      name: "cal",
      value: calendarId,
      type: "com.cisco.cccalendar.CCCalendar"
    })
  }
  return body
}
