const express = require('express')
const router = express.Router()
const teamsLogger = require('../models/teams-logger')

// get this user's info
router.get('/', async (req, res, next) => {
  try {
    // return to client
    return res.status(200).send(req.user)
  } catch (e) {
    teamsLogger.log(`Failed to get user info for ${req.user.username}: ${e.message}`)
    return res.status(500).send({message: e.message})
  }
})

module.exports = router
