const express = require('express')
const router = express.Router()
const db = require('../models/db')
const provision = require('../models/provision')
const queue = require('../models/queue')
const deprovision = require('../models/deprovision')

// check if we have reached the max number of users, and queue deprovision tasks
async function checkMaxProvision () {
  // MAX_USERS
  try {
    const maxUsers = parseInt(process.env.MAX_USERS || 50)
    console.log(`checking max users provisioned is not exceeding ${maxUsers}`)
    const projection = {_id: 1, created: 1, modified: 1, userId: 1, username: 1}
    // this will sort records with [0] being oldest and [length - 1] being newest
    const sort = {modified: 1}
    const existingUsers = await db.find('toolbox', 'user.provision', {}, projection, sort)
    // console.log('existing users in provision db:', existingUsers)
    if (existingUsers.length >= maxUsers) {
      // too many users provisioned. deprovision the oldest accounts to leave (maxUsers - 3) total users
      const qty = existingUsers.length - maxUsers + 3
      console.log(`too many users provisioned - there are ${existingUsers.length}. queueing tasks to deprovision the oldest ${qty} users.`)
      // queue tasks to deprovision the oldest users
      for (let i = 0; i < qty; i++) {
        let user = existingUsers.shift()
        console.log(`queueing user ${user.username} ${user.userId} to be deleted`)
        queue(async () => await deprovision(user), `deprovision user ${user.username} ${user.userId}`)
      }
    } else {
      console.log(`there are ${existingUsers.length} users, which does not exceed the max of ${maxUsers}`)
    }
  } catch (e) {
    console.log(`failed to check max users provisioned:`, e.message)
  }
}

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
    queue(async () => await provision.provision(user, password), `provision user ${user.username} ${user.id}`)
    // check if we have reached the max number of users provisioned
    checkMaxProvision()
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