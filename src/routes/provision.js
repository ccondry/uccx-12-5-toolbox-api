const express = require('express')
const router = express.Router()
const db = require('../models/db')

// get provision status
router.get('/', async function (req, res) {
  try {
    const username = req.user.username
    const userId = req.user.id
    // get provision info from local db, matching either username or userId
    const query = { $or: [ {username}, {userId} ] }
    const projection = { _id: 0 }
    const existing = await db.findOne('toolbox', 'provision', query, {projection})
    const body = existing || {}
    // return OK with body
    return res.status(200).send(body)
  } catch (e) {
    // error during processing
    console.log('failed to get provision status for', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

// provision user
router.post('/', async function (req, res) {
  try {
    const username = req.user.username
    const userId = req.user.id
    const filter = { $or: [ {username}, {userId} ] }
    const data = {
      username,
      userId,
      vertical: 'travel'
    }
    const results = await db.upsert('toolbox', 'provision', filter, data)
    if (results.ok === 1) {
      // return OK
      return res.status(200).send()
    } else {
      return res.status(500).send(results)
    }
  } catch (e) {
    // error during processing
    console.log('failed to get provision status for', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

// deprovision user
router.delete('/', async function (req, res) {
  try {
    const username = req.user.username
    const userId = req.user.id
    const filter = { $or: [ {username}, {userId} ] }
    const results = await db.deleteOne('toolbox', 'provision', filter)
    if (results.deletedCount === 1) {
      // return OK
      return res.status(200).send()
    } else {
      console.log('results.deletedCount is not 1. it is ', results.deletedCount)
      return res.status(500).send(results)
    }
  } catch (e) {
    // error during processing
    console.log('failed to deprovision user', req.user.username, `(${req.user.id}):`, e.message)
    return res.status(500).send({message: e.message})
  }
})

module.exports = router