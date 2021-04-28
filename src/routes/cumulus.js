const express = require('express')
const router = express.Router()
const db = require('../models/db')

// get demo user configuration, like vertical selection
router.get('/', async function (req, res) {
  try {
    const userId = req.user.id
    const config = await db.findOne('toolbox', 'cumulus.config', {userId})
    return res.status(200).send(config)
  } catch (e) {
    console.error(`failed to get cumulus config for ${req.user.email} ${req.user.id}:`, e.message)
    return res.status(500).send(e.message)
  }
})

// update demo user configuration, like vertical selection
router.post('/', async function (req, res) {
  try {
    const query = {userId: req.user.id}
    const updates = {
      $set: req.body
    }
    const config = await db.updateOne('toolbox', 'cumulus.config', query, updates)
    return res.status(200).send(config)
  } catch (e) {
    console.error(`failed to get cumulus config for ${req.user.email} ${req.user.id}:`, e.message)
    return res.status(500).send(e.message)
  }
})

module.exports = router
