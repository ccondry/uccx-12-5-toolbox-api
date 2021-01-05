const express = require('express')
const router = express.Router()

router.use('/cumulus', require('./cumulus'))

module.exports = router
