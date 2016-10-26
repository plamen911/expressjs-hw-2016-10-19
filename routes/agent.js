let express = require('express')
let router = express.Router()
let fs = require('fs')
let path = require('path')
let config = require('../config')
let Agent = require('../models/agent')
let Property = require('../models/property')
let _ = require('underscore')
let upload = require('../middleware/upload')

// Constants
let UPLOAD_DIR = path.join(__dirname, '/../public/uploads/avatars/')
let IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']

// utility functions
function getPostedData (req) {
  let params = (req && req.body) || null

  let phones = []
  if (params && params.phoneNum) {
    if (!_.isArray(params.phoneNum)) {
      params.phoneNum = [params.phoneNum]
      params.phoneType = [params.phoneType]
    }
    params.phoneNum.forEach((phoneNum, i) => {
      phones.push({
        phoneNum: phoneNum,
        phoneType: params.phoneType[i]
      })
    })
  }

  let emails = []
  if (params && params.emails) {
    if (!_.isArray(params.emails)) {
      params.emails = [params.emails]
    }
    params.emails.forEach((email) => {
      emails.push(email)
    })
  }

  return {
    title: params.title || '',
    firstName: params.firstName || '',
    middleInit: params.middleInit || '',
    lastName: params.lastName || '',
    preferredName: params.preferredName || '',
    company: params.company || '',
    notes: params.notes || '',
    streetAddr: params.streetAddr || '',
    streetAddr2: params.streetAddr2 || '',
    city: params.city || '',
    state: params.state || '',
    zip: params.zip || '',
    emails: emails,
    phones: phones
  }
}

let pageTitle = 'Agent Information'

// add new agent
router.post('/create',
  upload(UPLOAD_DIR, IMAGE_TYPES),
  (req, res, next) => {
    let data = getPostedData(req)

    // form validation
    let errors = []
    if (!data.firstName) {
      errors.push('First name is missing.')
    }
    if (!data.lastName) {
      errors.push('Last name is missing.')
    }
    if (errors.length) {
      let data = {
        pageTitle: pageTitle,
        formTitle: pageTitle,
        formAction: '/agent/create',
        errors: errors
      }
      data = _.extend(getPostedData(req), data)
      return res.render('form_agent', data)
    }

    new Agent(data)
          .save()
          .then((agent) => {
            res.redirect('/agent/update/' + agent._id)
          })
          .catch((err) => {
            res.render('error', {
              pageTitle: pageTitle,
              message: 'Error saving new agent.',
              error: err
            })
          })
  })

router.post('/update/:id',
  upload(UPLOAD_DIR, IMAGE_TYPES),
  (req, res, next) => {
    let _id = req.params.id || 0
    let data = getPostedData(req)
    let deleteOldFile = false

    // form validation
    let errors = []
    if (!data.firstName) {
      errors.push('First name is missing.')
    }
    if (!data.lastName) {
      errors.push('Last name is missing.')
    }
    if (req.files && req.files['avatar']) {
      if (!req.files['avatar'].uploadErrors.length) {
        deleteOldFile = true
        data.avatar = req.files['avatar'].fileName
      } else {
        req.files['avatar'].uploadErrors.forEach((error) => {
          errors.push(error)
        })
      }
    }

    if (errors.length) {
      let data = {
        pageTitle: pageTitle,
        formTitle: pageTitle,
        formAction: '/agent/update/' + _id,
        errors: errors
      }
      data = _.extend(getPostedData(req), data)
      return res.render('form_agent', data)
    }

    Agent
          .findOne({_id: _id})
          .then((agent) => {
            // housekeeping
            if (agent.avatar && deleteOldFile) {
              try {
                fs.unlinkSync(UPLOAD_DIR + agent.avatar)
              } catch (err) {
                console.log(`Error deleting old avatar: ${err.message}`)
              }
            }
            agent = _.extend(agent, data)
            agent
                  .save()
                  .then((agent) => {
                    res.redirect('/agent/update/' + agent._id)
                  })
                  .catch((err) => {
                    res.render('error', {
                      pageTitle: pageTitle,
                      message: 'Error updating agent.',
                      error: err
                    })
                  })
          })
          .catch((err) => {
            res.render('error', {
              pageTitle: pageTitle,
              message: 'Error selecting agent.',
              error: err
            })
          })
  })

// GET agent form.
router.get('/update/:id', (req, res, next) => {
  let _id = req.params.id || 0

  Agent
        .findOne({_id: _id})
        .populate('properties') // <-- only works if you pushed refs to children
        .then((agent) => {
          let data = {
            pageTitle: pageTitle,
            formTitle: pageTitle,
            formAction: '/agent/update/' + agent._id
          }
          data = _.extend(getPostedData(req), data)
          data = _.extend(data, agent)
          res.render('form_agent', data)
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: pageTitle,
            message: 'Error selecting agent.',
            error: err
          })
        })
})

router.get('/', (req, res, next) => {
  let data = {
    pageTitle: pageTitle,
    formTitle: 'Add New Agent',
    formAction: '/agent/create'
  }
  data = _.extend(getPostedData(req), data)
  res.render('form_agent', data)
})

// display list of agents
router.get('/list', (req, res, next) => {
  let firstName = req.params.firstName || null
  let lastName = req.params.firstName || null
  let email = req.params.email || null
  let pageSize = req.params.results || 10

  let query = {}
  if (firstName) {
    query.firstName = firstName
  }
  if (lastName) {
    query.lastName = lastName
  }
  if (email) {
    query.emails = email
  }

  Agent
      .find(query)
      .sort('-createdAt')
      .limit(pageSize)
      .then((agents) => {
        let data = {
          rows: agents
        }
        res.render('list_agents', data)
      })
      .catch((err) => {
        res.render('error', {
          pageTitle: 'Agent List',
          message: 'Error selecting agents.',
          error: err
        })
      })
})

router.get('/delete/:id', (req, res, next) => {
  let _id = req.params.id || 0

  Agent
        .findOne({_id: _id})
        .then((agent) => {
          if (agent.avatar) {
            try {
              fs.unlinkSync(UPLOAD_DIR + agent.avatar)
            } catch (err) {
              console.log(`Error deleting avatar: ${err.message}`)
            }
          }
          agent
                .remove()
                .then(() => {
                    // remove all references in property objects to this agent
                  Property
                        .find({_agent: _id})
                        .then((properties) => {
                            // loop trough each property to remove the agent reference
                          let removeAgentRef = (i) => {
                            if (typeof properties[i] === 'undefined') {
                                return res.redirect('/agent/list')
                            }
                            properties[i]._agent = null
                            properties[i]
                                    .save()
                                    .then((property) => {
                                      removeAgentRef(++i)
                                    })
                                    .catch((err) => {
                                      return res.render('error', {
                                        pageTitle: pageTitle,
                                        message: 'Error removing reference to agent.',
                                        error: err
                                      })
                                    })
                          }

                          if (properties && properties.length) {
                            removeAgentRef(0)
                          } else {
                            res.redirect('/agent/list')
                          }
                        })
                        .catch((err) => {
                          return console.log('Error selecting agent refs: ', err)
                        })
                })
                .catch((err) => {
                  return console.log('Error deleting agent: ', err)
                })
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: pageTitle,
            message: 'Error selecting agent.',
            error: err
          })
        })
})

module.exports = router
