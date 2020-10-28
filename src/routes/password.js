const express = require('express')
const router = express.Router()

// reset password
router.post('/', async function (req, res) {
  try {
    // TODO
    return res.status(200).send()
  } catch (e) {
    console.log('failed to reset password for', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

module.exports = router