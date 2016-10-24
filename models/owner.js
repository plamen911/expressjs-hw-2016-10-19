let mongoose = require('mongoose')
let Property = require('../models/property')
let Schema = mongoose.Schema

mongoose.Promise = global.Promise

// Owner schema
let schema = new Schema({
  title: {type: String, default: null},
  firstName: {type: String, default: null},
  middleInit: {type: String, default: null},
  lastName: {type: String, default: null, required: true},
  preferredName: {type: String, default: null},
  company: {type: String, default: null},
  notes: {type: String, default: null},
  streetAddr: {type: String, default: null},
  streetAddr2: {type: String, default: null},
  city: {type: String, default: null},
  state: {type: String, default: null},
  zip: {type: String, default: null},
  emails: {type: [String], default: []},
  phones: [{
    phoneNum: {type: String, default: null},
    phoneType: {type: String, default: null}
  }],
  properties: [{ type: Schema.ObjectId, ref: 'Property', default: null }],
  createdAt: {type: Date, default: null},
  updatedAt: {type: Date, default: Date.now},
  avatar: {type: String, default: null},
  username: {type: String, default: null},
  password: {type: String, default: null}
})

schema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date()
  }
  console.log('Saving owner')
  next()
})

let Owner = mongoose.model('Owner', schema)
module.exports = Owner
