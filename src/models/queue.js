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
      // get first task and remove it from the queue
      const task = queue.shift()
      // execute task and wait for it to complete
      try {
        await task()
      } catch (e) {
        console.log('failed to run provision or deprovision task:', e.message)
      }
    } else {
      // wait a moment before checking queue again
      await sleep(throttle)
    }
  }
}

// start task runner now
run()

module.exports = function (task) {
  // add to the queue
  queue.push(task)
}