var mongoose = require('mongoose')

mongoose.Promise = global.Promise

var configs = {
  local: {
    mongoDb: 'mongodb://localhost:27017/myproject'
  },
  development: {
    mongoDb: 'mongodb://localhost:27017/myproject'
  },
  test: {
    mongoDb: 'mongodb://localhost:27017/myproject'
  },
  production: {
    mongoDb: 'mongodb://localhost:27017/myproject'
  }
}

var env = process.env.NODE_ENV || 'production'
var config = configs[env]

mongoose.connect(config.mongoDb)

let db = mongoose.connection

db.on('error', (err) => {
  console.log('connection error: ', err)
})
db.once('open', (callback) => {
  console.log('Connection succeeded')
})

module.exports = config

