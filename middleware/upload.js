let fs = require('fs')
let path = require('path')
let uid = require('uid2')

// Constants
let UPLOAD_DIR = path.join(__dirname, '/../public/uploads/')
let IMAGE_TYPES = ['image/jpeg', 'image/png']

module.exports = (req, res, next) => {
  let writeStream
  let errors = []

  req.pipe(req.busboy)

  req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (filename) {
      let targetPath
      let targetName

            // get the extenstion of the file
      let extension = filename.split(/[. ]+/).pop()

            // create a new name for the image
      targetName = uid(22) + '.' + extension

      if (typeof req.files === 'undefined') {
        req.files = {}
      }

      req.files[fieldname] = {
        originalFileName: filename,
        fileExtension: extension,
        mimeType: mimetype,
        fileName: targetName,
        uploadErrors: []
      }

            // check to see if we support the file type
      if (IMAGE_TYPES.indexOf(mimetype) === -1) {
        errors.push(`Supported image formats: jpeg, jpg, jpe, png.`)
        req.files[fieldname].uploadErrors = errors
        return file.resume()
      }

            // determine the new path to save the image
      targetPath = path.join(UPLOAD_DIR + '/', targetName)

      writeStream = fs.createWriteStream(targetPath)
      file.pipe(writeStream)
      writeStream.on('close', () => {
                // res.redirect('back');
      })
    } else {
      file.resume()
    }
  })

  req.busboy.on('field', (key, value, keyTruncated, valueTruncated) => {
    req.body[key] = value
  })

  req.busboy.on('finish', () => {
    next()
  })
}
