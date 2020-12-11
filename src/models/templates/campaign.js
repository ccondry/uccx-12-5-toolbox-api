module.exports = function ({name, csqRefUrl}) {
  const body = {
    // "campaignId": 14,
    "campaignName": name,
    "enabled": true,
    "description": name,
    "startTime": "00:00",
    "endTime": "23:59",
    "timeZone": "Coordinated Universal Time",
    "campaignType": "AGENT",
    "dialerType": "DIRECT_PREVIEW",
    "pendingContacts": 0,
    "typeSpecificInfo": {
      "obPreview": {
        "maxDialAttempts": 1,
        "cacheSize": 20,
        "ansMachineRetry": false,
        "callbackTimeLimit": 15,
        // "missedCallbackAction": "NEXT_DAY",
        "missedCallbackAction": "CLOSE",
        "assignedCSQs": {
          "csq": [
            {
              // "@name": "12",
              "refURL": csqRefUrl
            }
          ]
        }
      }
    }
  }
  return body
}
