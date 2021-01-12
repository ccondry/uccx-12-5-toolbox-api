require('dotenv').config()

const db = require('../src/models/db')
const queue = require('../src/models/queue')
const deprovision = require('../src/models/deprovision')

async function test () {
  try {
    const projection = {_id: 1, created: 1, modified: 1, userId: 1, username: 1}
    // this will sort records with [0] being oldest and [length - 1] being newest
    const sort = {modified: 1}
    const existingUsers = await db.find('toolbox', 'user.provision', {}, projection, sort)
    const length = existingUsers.length
    console.log('found', length, 'existing users')
    // queue tasks to deprovision all users
    for (let i = 0; i < length; i++) {
      let user = existingUsers.shift()
      // console.log(`queueing user ${user.username} ${user.userId} to be deleted`)
      queue(async () => await deprovision(user), `deprovision user ${user.username} ${user.userId}`)
    }
  } catch (e) {
    console.log(e)
  }
}

test()