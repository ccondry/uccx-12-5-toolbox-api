// validate .env vars

module.exports = function (vars) {
  for (const v of vars) {
    if (!process.env[v]) {
      console.warn(`process.env.${v} is not set. Please configure this value in the .env file.`)
    }
  }
}
