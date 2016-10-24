let express = require('express')
let router = express.Router()
let config = require('../config')
let Owner = require('../models/owner')
let Phone = require('../models/phone')
let async = require('async')
let _ = require('underscore')

let defaultData = {
  ptitle: 'Owner Information',
  title: '',
  firstName: '',
  middleInit: '',
  lastName: '',
  preferredName: '',
  company: '',
  username: '',
  password: '',
  notes: '',
  streetAddr: '',
  streetAddr2: '',
  city: '',
  state: '',
  zip: '',
  emails: [],
  phones: [],
  properties: []
}

// add/update owner data
router.post('/update/:id', function (req, res, next) {
  let _id = req.params.id || 0

  var data = {}
  data.title = req.body.title || ''
  data.firstName = req.body.firstName || ''
  data.middleInit = req.body.middleInit || ''
  data.lastName = req.body.lastName || ''
  data.preferredName = req.body.preferredName || ''
  data.company = req.body.company || ''
    // data.username = req.body.username || ''
    // data.password = req.body.password || ''
  data.notes = req.body.notes || ''
  data.streetAddr = req.body.streetAddr || ''
  data.streetAddr2 = req.body.streetAddr2 || ''
  data.city = req.body.city || ''
  data.state = req.body.state || ''
  data.zip = req.body.zip || ''
  data.phones = null

  Owner
        .findOne({_id: _id})
        .then((owner) => {
          owner = _.extend(owner, data)
          owner
                .save()
                .then((owner) => {
                  console.log('req.body.phones: ', req.body['phoneNum[]'])
                  console.log('req.body: ', JSON.parse(req.body))
                  console.log('req.rawBody: ', JSON.parse(req.rawBody))

                    // update phones
                    /* let phones = [];
                    if (req.body.phones) {
                        req.body.phones.forEach((item, i) => {
                            phones.push((callback) => {
                                new Phone({
                                    _owner: owner._id,
                                    phoneNum: item.phoneNum,
                                    phoneType: item.phoneType
                                })
                                    .save()
                                    .then((phone) => {
                                        owner.phones.push(phone)
                                        owner
                                            .save()
                                            .then((owner) => {
                                                callback(null, phone)
                                            })
                                            .catch((err) => {
                                                callback(err, null)
                                            })

                                    })
                                    .catch((err) => {
                                        callback(err, null)
                                    })
                            })
                        })
                    }

                    async.parallel(phones, (err, results) => {
                        if (err) {
                            return console.log('Error saving phone: ', err.message)
                        }

                        console.log('Nice work!')
                        res.redirect('/owner/' + owner._id)
                    }); */
                })
                .catch((err) => {
                  console.log('Error updating owner: ', err.message)
                })
        })
        .catch((err) => {
          new Owner(data)
                .save()
                .then((owner) => {
                  console.log('new owner created: ', owner._id)
                })
                .catch((err) => {
                  console.log('Error saving new owner: ', err.message)
                })

          console.log('Error selecting owner: ', err.message)
        })

/*
    new Owner({
        // _id: _id,
        title: 'Mr',
        firstName: 'Plamen',
        middleInit: 'PM',
        lastName: 'Markov',
        preferredName: 'Plamen',
        company: 'Home',
        username: 'plamen911',
        password: '1',
        notes: '',
        streetAddr: 'Knyaz Boris',
        streetAddr2: '',
        city: 'Pleven',
        state: 'Pleven',
        zip: '5800',
        emails: ['plamen@lynxlake.org'],
    })
        .save()
        .then((owner) => {

            console.log('new owner created: ', owner._id);

            new Phone({
                _owner: owner._id,
                phoneNum: '123321',
                phoneType: 'home'
            })
                .save()
                .then((phone) => {
                    owner.phones.push(phone)
                    owner.save();
                })
                .catch((err) => {
                    console.log('Error saving phone: ', err.message)
                })

        })
        .catch((err) => {
            console.log('Error saving new owner: ', err.message)
        }) */
})

// GET owner form.
router.get('/:id', function (req, res, next) {
  let _id = req.params.id || 0

  Owner
        .findOne({_id: _id})
        .populate('phones')
        .then((owner) => {
          let data = _.extend(defaultData, owner)
          res.render('owner', data)
        })
        .catch((err) => {
          console.log('Error selecting owner: ', err.message)
          defaultData.errors = ['Error selecting owner: ' + err.message]
          res.render('owner', defaultData)
        })
})

router.get('/', function (req, res, next) {
  res.render('owner', defaultData)
})

module.exports = router
