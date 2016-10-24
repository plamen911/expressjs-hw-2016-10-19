let mongoose = require('mongoose')
let Owner = require('../models/owner')
let Agent = require('../models/agent')
let Schema = mongoose.Schema

mongoose.Promise = global.Promise

// Property schema
let schema = new Schema({
  _owner: {type: Schema.ObjectId, ref: 'Owner'},
  _agent: {type: Schema.ObjectId, ref: 'Agent'},
  propertyName: {type: String, default: null},
  area: {type: String, default: null},
  streetAddr: {type: String, default: null},
  streetAddr2: {type: String, default: null},
  city: {type: String, default: null},
  state: {type: String, default: null},
  zip: {type: String, default: null},
  lat: {type: String, default: null},
  lng: {type: String, default: null},
  phone: {type: String, default: null},
  fax: {type: String, default: null},
  cleanningHours: {type: String, default: null},
  checkInTime: {type: String, default: null},
  checkOutTime: {type: String, default: null},
  showPropertyOnWeb: {type: String, default: 'No'},
  showAddressOnWeb: {type: String, default: 'No'},
  status: {type: String, default: 'Inactive'},
  notes: {type: String, default: null},
  comments: {type: String, default: null},
  description: {type: String, default: null},
  firstFloorDescription: {type: String, default: null},
  secondFloorDescription: {type: String, default: null},
  thirdFloorDescription: {type: String, default: null},
  lowerLevelDescription: {type: String, default: null},
  cottageDescription: {type: String, default: null},
  images: [{
    imageFile: {type: String, default: null},
    imageName: {type: String, default: null},
    caption: {type: String, default: null}
  }],
  bedrooms: [{
    bedroomType: {type: String, default: null},
    floor: {type: String, default: null}
  }],
  bedroomsNum: {type: Number, default: 0},
  sleepingCapacity: {type: Number, default: 0},
  baths: [{
    bathType: {type: String, default: null},
    floor: {type: String, default: null}
  }],
  bathNum: {type: Number, default: 0},
  bathsNum: {type: Number, default: 0},
  // amenities
  // household
  washer: {type: Boolean, default: false},
  dryer: {type: Boolean, default: false},
  iron: {type: Boolean, default: false},
  ironBoard: {type: Boolean, default: false},
  crib: {type: Boolean, default: false},
  highChair: {type: Boolean, default: false},
  // outdoors
  charcoalBBQ: {type: Boolean, default: false},
  gasBBQ: {type: Boolean, default: false},
  beachTowels: {type: Boolean, default: false},
  cooler: {type: Boolean, default: false},
  beachChairs: {type: Boolean, default: false},
  outdoorShower: {type: Boolean, default: false},
  // kitchen
  stove: {type: String, default: null},
  microwave: {type: Boolean, default: false},
  disposal: {type: Boolean, default: false},
  dishwasher: {type: Boolean, default: false},
  toaster: {type: Boolean, default: false},
  blender: {type: Boolean, default: false},
  mixer: {type: Boolean, default: false},
  coffeeMaker: {type: Boolean, default: false},
  foodProcessor: {type: Boolean, default: false},
  lobsterPot: {type: Boolean, default: false},
  createdAt: {type: Date, default: null},
  updatedAt: {type: Date, default: Date.now}
})

schema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date()
  }
  console.log('Saving property')
  next()
})

let Property = mongoose.model('Property', schema)
module.exports = Property
