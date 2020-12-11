module.exports = function ({userId, chatCsqName, chatCsqRefUrl}) {
  return {
    "name": "Chat_" + userId,
    "description": "Chat widget for " + userId,
    "formField": [
      "Name",
      "Email",
      "PhoneNumber"
    ],
    // "contextServiceFieldsets": "",
    "welcomeMessage": "Thank you for contacting us. A customer care representative would assist you soon.",
    "agentJoinTimeoutMsg": "All our customer care representatives are busy. You may wait or try again later.",
    "chatErrorMsg": "Chat service is currently unavailable. Try later.",
    "problemStatementCSQPair": [
      {
        "problemStatement": "Issue",
        "csq": {
          "@name": chatCsqName,
          "refURL": chatCsqRefUrl
        }
      }
    ],
    "type": "bubble",
    "bubbleStyle": {
      "titleText": "Customer Care",
      "titleTextColor": "#0AB7D7",
      "buttonText": "Start Chat",
      "buttonTextColor": "#FFFFFF",
      "buttonBackgroundColor": "#0AB7D7",
      "problemStmtCaption": "Choose a problem statement",
      "agentMessageTextColor": "#FFFFFF",
      "agentMessageBackgroundColor": "#0AC391",
      "fontType": "Helvetica"
    },
    "bubbleMessages": {
      "textForTypingMsg": "Type your message and press Enter",
      "agentJoinedMsg": " ${agent_alias} has joined",
      "agentLeftMsg": " ${agent_alias} has left the chat",
      "afterChatSessionTranscriptPopupMsg": {
        "transcriptPopupMsg": "Chat has ended. Do you want to download the chat transcript?",
        "transcriptPopupNegativeMsg": "No",
        "transcriptPopupPositiveMsg": "Yes"
      },
      "closeChatConfirmationPopupMsg": {
        "closeChatPopupMsg": "Do you want to close the chat?",
        "closeChatPopupNegativeMsg": "No",
        "closeChatPopupPositiveMsg": "Yes"
      },
      "connectivityErrorMsg": "Chat disconnected due to inactivity timeout or connection failure."
    },
    "postChatRating": {
      "ratingEnabled": true,
      "ratingLabel": "Rate your chat experience",
      "ratingButtonText": "Submit"
    }
  }
}
