const mongo = require('@ccondry/mongo-wrapper')
const db = new mongo(process.env.MONGO_URL)

module.exports = db