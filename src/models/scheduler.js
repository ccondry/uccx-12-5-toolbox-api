// scheduled jobs
const deleteAfter = process.env.DELETED_EXPIRED_AFTER || 90

async function start () {
  try {
    // put jobs code here
  } catch (e) {
    console.log(e)
    teamsLogger.log(`Failed to start checks for active and expired users: ${e.message}`)
  }
}

module.exports = {
  start
}