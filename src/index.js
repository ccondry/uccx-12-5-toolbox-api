// load environment file
require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const expressJwt = require('express-jwt')
const requestIp = require('request-ip')

const environment = require('./models/environment')
const jwtCert = require('./models/jwt-certificate')
const teamsLogger = require('./models/teams-logger')
// start job scheduler
require('./models/scheduler').start()
// set up Node.js HTTP port
const port = process.env.NODE_PORT

const urlBase = '/api/v1/uccx-12-5'
// JWT path exceptions - these paths can be used without a JWT required
const exceptions = {
  path: [{
    // this application version
    url: new RegExp(urlBase + '/version', 'i'),
    methods: ['GET']
  }, {
    // public REST APIs
    url: new RegExp(urlBase + '/public', 'i'),
    methods: ['GET']
  }]
}

// init express app, and configure it
const app = express()
// parse JSON body into req.body, up to 256kb
app.use(bodyParser.json({limit: '256kb'}))
// enable CORS
app.use(cors())
// get remote IP address of request client as req.clientIp
app.use(requestIp.mw())
// require valid JWT for all paths unless in the exceptins list, and parse JWT payload into req.user
app.use(expressJwt({ secret: jwtCert }).unless(exceptions))

// run this code on every request
app.use(async function (req, res, next) {
  // continue processing
  next()
})

// error handling when JWT validation fails
app.use(function(err, req, res, next) {
  try {
    if (err) {
      // console.log(err)
      // return status to user
      return res.status(err.status).send(err.message)
    } else {
      // no errors
    }
  } catch (e) {
    console.log(e.message)
  }

  // continue processing
  next()
})

/*****
Routes
*****/

// get this API version
app.use(urlBase + '/version', require('./routes/version'))

// ldap user accounts
app.use(urlBase + '/user', require('./routes/user'))

// demo environment info
app.use(urlBase + '/provision', require('./routes/provision'))

// public REST APIs
app.use(urlBase + '/public', require('./routes/public'))

// start listening
app.listen(port, () => {
  // const message = `${environment.name} version ${environment.version} service started on ${environment.hostname}. Listening on port ${port}.`
  // console.log(message)
  teamsLogger.log('service started on port ' + port)
})
