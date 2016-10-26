let express = require('express')
let router = express.Router()
let fs = require('fs')
let path = require('path')
let config = require('../config')
let Property = require('../models/property')
let Owner = require('../models/owner')
let Agent = require('../models/agent')
let _ = require('underscore')
let upload = require('../middleware/upload')

let UPLOAD_DIR = path.join(__dirname, '/../public/uploads/images/')
let IMAGE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']

// utility functions
function getPostedData (req) {
  let params = (req && req.body) || null

  return {
    _owner: params._owner || '',
    _agent: params._agent || '',
    propertyName: params.propertyName || '',
    area: params.area || '',
    streetAddr: params.streetAddr || '',
    streetAddr2: params.streetAddr2 || '',
    city: params.city || '',
    state: params.state || '',
    zip: params.zip || '',
    lat: params.lat || '',
    lng: params.lng || '',
    phone: params.phone || '',
    fax: params.fax || '',
    cleanningHours: params.cleanningHours || '',
    checkInTime: params.checkInTime || '',
    checkOutTime: params.checkOutTime || '',
    showPropertyOnWeb: params.showPropertyOnWeb || 'No',
    showAddressOnWeb: params.showAddressOnWeb || 'No',
    status: params.status || 'Inactive',
    notes: params.notes || '',
    comments: params.comments || '',
    description: params.description || '',
    firstFloorDescription: params.firstFloorDescription || '',
    secondFloorDescription: params.secondFloorDescription || '',
    thirdFloorDescription: params.thirdFloorDescription || '',
    lowerLevelDescription: params.lowerLevelDescription || '',
    cottageDescription: params.cottageDescription || ''
  }
}

let pageTitle = 'Property Information'

// add new property
router.post('/create',
    getOwnerPulldownData,
    getAgentPulldownData,
    upload(UPLOAD_DIR, IMAGE_TYPES),
    (req, res, next) => {
      let data = getPostedData(req)

      // form validation
      let errors = []
      if (!data._owner) {
        errors.push('Owner is missing.')
      }
      if (!data._agent) {
        errors.push('Agent is missing.')
      }
      if (!data.streetAddr) {
        errors.push('Street Address is missing.')
      }
      if (!data.area) {
        errors.push('Area is missing.')
      }
      if (errors.length) {
        let data = {
          pageTitle: pageTitle,
          formTitle: pageTitle,
          formAction: '/property/create',
          errors: errors,
          owners: req.owners,
          agents: req.agents
        }
        data = _.extend(getPostedData(req), data)
        return res.render('form_property', data)
      }

      new Property(data)
          .save()
          .then((property) => {
            req.property = property
            next()
          })
          .catch((err) => {
            res.render('error', {
              pageTitle: pageTitle,
              message: 'Error saving new property.',
              error: err
            })
          })
    },
    unlinkPropertyFromOwner,
    linkPropertyToOwner,
    unlinkPropertyFromAgent,
    linkPropertyToAgent,
    (req, res, next) => {
      res.redirect('/property/update/' + req.property._id)
    }
)

router.post('/update/:id',
    getOwnerPulldownData,
    getAgentPulldownData,
    upload(UPLOAD_DIR, IMAGE_TYPES),
    (req, res, next) => {
      let _id = req.params.id || 0
      let data = getPostedData(req)

      // form validation
      let errors = []
      if (!data._owner) {
        errors.push('Owner is missing.')
      }
      if (!data._agent) {
        errors.push('Agent is missing.')
      }
      if (!data.area) {
        errors.push('Area is missing.')
      }
      if (!data.streetAddr) {
        errors.push('Street Address is missing.')
      }
      if (req.files && req.files['avatar']) {
        if (!req.files['avatar'].uploadErrors.length) {
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
          formAction: '/property/update/' + _id,
          errors: errors,
          owners: req.owners,
          agents: req.agents
        }
        data = _.extend(getPostedData(req), data)
        return res.render('form_property', data)
      }

      Property
          .findOne({_id: _id})
          .then((property) => {
            req.old_owner = property._owner
            req.old_agent = property._agent

            property = _.extend(property, data)
            property
                .save()
                .then((property) => {
                  req.property = property
                  next()
                })
                .catch((err) => {
                  res.render('error', {
                    pageTitle: pageTitle,
                    message: 'Error updating property.',
                    error: err
                  })
                })
          })
          .catch((err) => {
            res.render('error', {
              pageTitle: pageTitle,
              message: 'Error selecting property.',
              error: err
            })
          })
    },
    unlinkPropertyFromOwner,
    linkPropertyToOwner,
    unlinkPropertyFromAgent,
    linkPropertyToAgent,
    (req, res, next) => {
      res.redirect('/property/update/' + req.property._id)
    }
)

// GET property form.
router.get('/update/:id',
    getOwnerPulldownData,
    getAgentPulldownData,
    (req, res, next) => {
      let _id = req.params.id || 0

      Property
            .findOne({_id: _id})
            .then((property) => {
              let data = {
                pageTitle: pageTitle,
                formTitle: pageTitle,
                formAction: '/property/update/' + property._id,
                owners: req.owners,
                agents: req.agents
              }
              data = _.extend(getPostedData(req), data)
              data = _.extend(data, property)

              data._owner = (data._owner && data._owner.toString()) || null
              data._agent = (data._agent && data._agent.toString()) || null

              res.render('form_property', data)
            })
            .catch((err) => {
              res.render('error', {
                pageTitle: pageTitle,
                message: 'Error selecting property.',
                error: err
              })
            })
    })

router.get('/',
  getOwnerPulldownData,
  getAgentPulldownData,
  (req, res, next) => {
    let data = {
      pageTitle: pageTitle,
      formTitle: 'Add New Property',
      formAction: '/property/create',
      owners: req.owners,
      agents: req.agents
    }
    data = _.extend(getPostedData(req), data)
    res.render('form_property', data)
  })

// display list of properties
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

  Property
      .find(query)
      .populate('_owner') // <-- only works if you pushed refs to children
      .populate('_agent') // <-- only works if you pushed refs to children
      .sort('-createdAt')
      .limit(pageSize)
      .then((properties) => {
        let data = {
          rows: properties
        }
        res.render('list_properties', data)
      })
      .catch((err) => {
        res.render('error', {
          pageTitle: 'Property List',
          message: 'Error selecting properties.',
          error: err
        })
      })
})

router.get('/delete/:id',
  (req, res, next) => {
    let _id = req.params.id || 0

    Property
          .findOne({_id: _id})
          .then((property) => {
            property
                  .remove()
                  .then(() => {
                    req.property = {
                      _owner: '',
                      _agent: ''
                    }

                    req.old_owner = property._owner
                    req.old_agent = property._agent
                    next()
                  })
                  .catch((err) => {
                    res.render('error', {
                      pageTitle: pageTitle,
                      message: 'Error deleting property.',
                      error: err
                    })
                  })
          })
          .catch((err) => {
            res.render('error', {
              pageTitle: pageTitle,
              message: 'Error selecting property.',
              error: err
            })
          })
  },
    unlinkPropertyFromOwner,
    unlinkPropertyFromAgent,
    (req, res, next) => {
      res.redirect('/property/list')
    }
)

module.exports = router

// utility funcs
function getOwnerPulldownData (req, res, next) {
    // get all owners
  Owner
        .find({})
        .sort('-createdAt')
        .then((owners) => {
          owners.unshift({
            _id: '',
            firstName: '- select -',
            lastName: ''
          })
          req.owners = owners
          next()
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: 'Owner List',
            message: 'Error selecting owners.',
            error: err
          })
        })
}

function getAgentPulldownData (req, res, next) {
    // get all agents
  Agent
        .find({})
        .sort('-createdAt')
        .then((agents) => {
          agents.unshift({
            _id: '',
            firstName: '- select -',
            lastName: ''
          })
          req.agents = agents
          next()
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: 'Agent List',
            message: 'Error selecting agents.',
            error: err
          })
        })
}

function unlinkPropertyFromOwner (req, res, next) {
  if (req.old_owner && req.old_owner.toString() !== req.property._owner.toString()) {
    Owner
            .findOne({_id: req.old_owner})
            .then((owner) => {
              let properties = owner.properties || []
              if (properties.length) {
                let index = _.indexOf(properties, req.old_owner.toString())
                properties.splice(index, 1)
              }
              owner.properties = properties
              owner
                    .save()
                    .then((owner) => {
                      next()
                    })
                    .catch((err) => {
                      res.render('error', {
                        pageTitle: pageTitle,
                        message: 'Error updating owner.',
                        error: err
                      })
                    })
            })
            .catch((err) => {
              res.render('error', {
                pageTitle: pageTitle,
                message: 'Error selecting owner.',
                error: err
              })
            })
  } else {
    next()
  }
}

// saving a ref. to this property in owner's object
function linkPropertyToOwner (req, res, next) {
  Owner
        .findOne({_id: req.property._owner})
        .then((owner) => {
          let properties = owner.properties || []
          properties.push(req.property._id)
          properties = _.uniq(properties, (property) => {
            return property.toString()
          })
          owner.properties = properties
          owner
                .save()
                .then((owner) => {
                  next()
                })
                .catch((err) => {
                  res.render('error', {
                    pageTitle: pageTitle,
                    message: 'Error updating owner.',
                    error: err
                  })
                })
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: pageTitle,
            message: 'Error selecting owner.',
            error: err
          })
        })
}

function unlinkPropertyFromAgent (req, res, next) {
  if (req.old_agent && req.old_agent.toString() !== req.property._agent.toString()) {
    Agent
            .findOne({_id: req.old_agent})
            .then((agent) => {
              let properties = agent.properties || []
              if (properties.length) {
                let index = _.indexOf(properties, req.old_agent.toString())
                properties.splice(index, 1)
              }
              agent.properties = properties
              agent
                    .save()
                    .then((agent) => {
                      next()
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
  } else {
    next()
  }
}

// saving a ref. to this property in agent's object
function linkPropertyToAgent (req, res, next) {
  Agent
        .findOne({_id: req.property._agent})
        .then((agent) => {
          let properties = agent.properties || []
          properties.push(req.property._id)
          properties = _.uniq(properties, (property) => {
            return property.toString()
          })
          agent.properties = properties
          agent
                .save()
                .then((agent) => {
                  next()
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
}
