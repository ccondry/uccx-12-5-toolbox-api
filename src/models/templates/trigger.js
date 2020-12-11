module.exports = function ({
  directoryNumber,
  deviceName,
  description = '',
  applicationName,
  applicationRefUrl
}) {
  const body = {
    // "self": {
    //   "@rel": "self",
    //   "@href": "https://uccx1.dcloud.cisco.com/adminapi/trigger/4065",
    //   "@type": "trigger"
    // },
    directoryNumber,
    "locale": "en_US",
    "application": {
      "@name": applicationName,
      "refURL": applicationRefUrl
    },
    deviceName,
    description,
    "callControlGroup": {
      "@name": "16",
      "refURL": "https://uccx1.dcloud.cisco.com/adminapi/callControlGroup/16"
    },
    "triggerEnabled": true,
    "maxNumOfSessions": 5,
    "idleTimeout": 5000,
    "overrideMediaTermination": {
      "dialogGroup": [
        {
          "@name": "1",
          "refURL": "https://uccx1.dcloud.cisco.com/adminapi/dialogGroup/1"
        },
        {
          "@name": "0",
          "refURL": "https://uccx1.dcloud.cisco.com/adminapi/dialogGroup/0"
        }
      ]
    },
    "alertingNameAscii": "",
    "devicePool": "dCloud_DP",
    "location": "Hub_None",
    "partition": "dCloud_PT",
    "voiceMailProfile": "None",
    "callingSearchSpace": "dCloud_CSS",
    "callingSearchSpaceForRedirect": "default",
    "presenceGroup": "Standard Presence group",
    "forwardBusy": {
      "forwardBusyVoiceMail": false,
      "forwardBusyDestination": "",
      "forwardBusyCallingSearchSpace": "None"
    },
    "display": "",
    "externalPhoneMaskNumber": ""
  }
  return body
}
