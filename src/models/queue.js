const provision = require('./provision')
const db = require('./db')

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// the queue of tasks
const queue = []

// how long to wait when nothing in queue
const throttle = 10 * 1000

// task runner
async function run () {
  // loop forever
  while (true) {
    if (queue.length) {
      console.log(`processing queue - ${queue.length} task(s) to run`)
      // get first task and remove it from the queue
      const {task, info} = queue.shift()
      // execute task and wait for it to complete
      try {
        console.log(`processing queue - task started:`, info)
        await task()
        console.log(`processing queue - task complete:`, info)
      } catch (e) {
        console.log('queued task failed:', info, ':', e.message)
      }
    } else {
      // wait a moment before checking queue again
      await sleep(throttle)
    }
  }
}

// add a task to the queue
function addTask (task, info) {
  console.log('adding task to the queue:', info)
  // add to the queue
  queue.push({task, info})
}

// fill task runner with any incomplete provision user tasks
db.find('toolbox', 'user.provision', {status: 'working'})
.then(unfinishedTasks => {
  for (const task of unfinishedTasks) {
    const user = {
      id: task.userId,
      username: task.username,
      email: task.email
    }
    // add to queue - use default password since their LDAP account is likely (hopefully) already created
    addTask(async () => await provision.provision(user, 'C1sco12345'), `provision user ${user.email} ${user.id}`)
  }
})
.catch(e => {
  console.log('failed while finding unfinished tasks at service start:', e.message)
})
.finally(() => {
  // start task runner now
  run()
})


module.exports = addTask