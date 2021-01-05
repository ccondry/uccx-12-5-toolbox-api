const express = require('express')
const router = express.Router()
const db = require('../../models/db')

router.get('/:userId', async function (req, res) {
  let userId = req.params.userId
  console.log('request to GET user Cumulus demo config on /public/cumulus for', userId)

  try {
    console.log('getting local cumulus config for userId', userId)
    // get cumulus user config
    const config = await db.findOne('toolbox', 'cumulus.config', {userId})
    return res.status(200).send(config)
  } catch (e) {
    console.error('failed to get cumulus config:', e.message)
    return res.status(500).send(e.message)
  }
})

module.exports = router
