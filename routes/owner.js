let express = require('express')
let router = express.Router()
let fs = require('fs')
let path = require('path')
let config = require('../config')
let Owner = require('../models/owner')
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

let pageTitle = 'Owner Information'

// add new owner
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
          formAction: '/owner/create',
          errors: errors
        }
        data = _.extend(getPostedData(req), data)
        return res.render('form_owner', data)
      }

      new Owner(data)
            .save()
            .then((owner) => {
              res.redirect('/owner/update/' + owner._id)
            })
            .catch((err) => {
              res.render('error', {
                pageTitle: pageTitle,
                message: 'Error saving new owner.',
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
          formAction: '/owner/update/' + _id,
          errors: errors
        }
        data = _.extend(getPostedData(req), data)
        return res.render('form_owner', data)
      }

      Owner
            .findOne({_id: _id})
            .then((owner) => {
              // housekeeping
              if (owner.avatar && deleteOldFile) {
                try {
                  fs.unlinkSync(UPLOAD_DIR + owner.avatar)
                } catch (err) {
                  console.log(`Error deleting old avatar: ${err.message}`)
                }
              }
              owner = _.extend(owner, data)
              owner
                    .save()
                    .then((owner) => {
                      res.redirect('/owner/update/' + owner._id)
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
    })

// GET owner form.
router.get('/update/:id', (req, res, next) => {
  let _id = req.params.id || 0

  Owner
        .findOne({_id: _id})
        .populate('properties')
        .then((owner) => {
          let data = {
            pageTitle: pageTitle,
            formTitle: pageTitle,
            formAction: '/owner/update/' + owner._id
          }
          data = _.extend(getPostedData(req), data)
          data = _.extend(data, owner)
          res.render('form_owner', data)
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: pageTitle,
            message: 'Error selecting owner.',
            error: err
          })
        })
})

router.get('/', (req, res, next) => {
  let data = {
    pageTitle: pageTitle,
    formTitle: 'Add New Owner',
    formAction: '/owner/create'
  }
  data = _.extend(getPostedData(req), data)
  res.render('form_owner', data)
})

// display list of owners
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

  Owner
        .find(query)
        .sort('-createdAt')
        .limit(pageSize)
        .then((owners) => {
          let data = {
            rows: owners
          }
          res.render('list_owners', data)
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: 'Owner List',
            message: 'Error selecting owners.',
            error: err
          })
        })
})

router.get('/delete/:id', (req, res, next) => {
  let _id = req.params.id || 0

  Owner
        .findOne({_id: _id})
        .then((owner) => {
          if (owner.avatar) {
            try {
              fs.unlinkSync(UPLOAD_DIR + owner.avatar)
            } catch (err) {
              console.log(`Error deleting avatar: ${err.message}`)
            }
          }
          owner
                .remove()
                .then(() => {
                    // remove all references in property objects to this owner
                  Property
                        .find({_owner: _id})
                        .then((properties) => {
                          // loop trough each property to remove the owner reference
                          let removeOwnerRef = (i) => {
                            if (typeof properties[i] === 'undefined') {
                              return res.redirect('/owner/list')
                            }
                            properties[i]._owner = null
                            properties[i]
                                    .save()
                                    .then((property) => {
                                      removeOwnerRef(++i)
                                    })
                                    .catch((err) => {
                                      return res.render('error', {
                                        pageTitle: pageTitle,
                                        message: 'Error removing reference to owner.',
                                        error: err
                                      })
                                    })
                          }

                          if (properties && properties.length) {
                            removeOwnerRef(0)
                          } else {
                            res.redirect('/owner/list')
                          }
                        })
                        .catch((err) => {
                          console.log('Error selecting owner refs: ', err)
                        })
                })
                .catch((err) => {
                  console.log('Error deleting owner: ', err)
                })
        })
        .catch((err) => {
          res.render('error', {
            pageTitle: pageTitle,
            message: 'Error selecting owner.',
            error: err
          })
        })
})

module.exports = router
