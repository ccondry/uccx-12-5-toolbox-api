const express = require('express')
const router = express.Router()
const db = require('../models/db')
const provision = require('../models/provision')
const queue = require('../models/queue')

// get provision status
router.get('/', async function (req, res) {
  try {
    const username = req.user.username
    const userId = req.user.id
    // get provision info from local db, matching either username or userId
    const query = { $or: [ {username}, {userId} ] }
    const projection = { _id: 0 }
    const existing = await db.findOne('toolbox', 'user.provision', query, {projection})
    const body = existing || {}
    // return OK with body
    return res.status(200).send(body)
  } catch (e) {
    // error during processing
    console.log('failed to get provision status for', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

// provision user in UCCX, LDAP, CUCM, etc.
router.post('/', async function (req, res) {
  try {
    // use toolbox user info for account provision
    const user = {
      ...req.user, 
      // default vertical to travel if not provided
      vertical: req.body.vertical || 'travel'
    }
    // user's new RDP and VPN account password
    const password = req.body.password
    // add to queue
    queue(async () => await provision(user, password))
    // accepted
    return res.status(202).send()
  } catch (e) {
    // error during processing
    console.log('failed to get provision status for', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

// deprovision user
// router.delete('/', async function (req, res) {
//   try {
//     const username = req.user.username
//     const userId = req.user.id
//     const filter = { $or: [ {username}, {userId} ] }
//     const results = await db.deleteOne('toolbox', 'user.provision', filter)
//     if (results.deletedCount === 1) {
//       // return OK
//       return res.status(200).send()
//     } else {
//       console.log('results.deletedCount is not 1. it is ', results.deletedCount)
//       return res.status(500).send(results)
//     }
//   } catch (e) {
//     // error during processing
//     console.log('failed to deprovision user', req.user.username, `(${req.user.id}):`, e.message)
//     return res.status(500).send({message: e.message})
//   }
// })

module.exports = router