let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let busboy = require('connect-busboy')
let stylus = require('stylus')

let routes = require('./routes/index')
let property = require('./routes/property')
let owner = require('./routes/owner')
let agent = require('./routes/agent')
let users = require('./routes/users')

let app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(busboy())
app.use(express.static(path.join(__dirname, 'public')))
app.use(stylus.middleware({
  src: path.join(__dirname, 'public'),
  compile: (str, path) => stylus(str).set('filename', path)
}))

app.use('/', routes)
app.use('/property', property)
app.use('/owner', owner)
app.use('/agent', agent)
app.use('/users', users)

// page not found
app.all('*', (req, res) => {
  let err = new Error('Page Not Found')
  err.message = 'Page Not Found.'
  err.status = 404
  err.stack = 'This is not the page you were looking for.'
  res.render('error', {
    pageTitle: 'Page Not Found',
    message: err.message,
    error: err
  })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
