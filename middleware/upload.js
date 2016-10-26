let fs = require('fs')
let path = require('path')
let uid = require('uid2')
let _ = require('underscore')

module.exports = (uploadDir, allowedMimes) => {
  return (req, res, next) => {
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
        if (allowedMimes && allowedMimes.indexOf(mimetype) === -1) {
          let types = []
          for (let i in allowedMimes) {
            if (allowedMimes.hasOwnProperty(i)) {
              types.push(allowedMimes[i].split(/[\/ ]+/).pop())
            }
          }
          errors.push('Supported image formats: ' + types.join(', ') + '.')
          req.files[fieldname].uploadErrors = errors
          return file.resume()
        }

        try {
          fs.mkdirSync(uploadDir)
        } catch (err) {
          console.log(`Error creating dir: ${err.message}`)
        }

        // determine the new path to save the image
        targetPath = path.join(uploadDir + '/', targetName)

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
      key = key.replace(/[^a-z0-9_]/gi, '')
      if (req.body.hasOwnProperty(key)) {
        if (_.isArray(req.body[key])) {
          req.body[key].push(value)
        } else {
          req.body[key] = [req.body[key], value]
        }
      } else {
        req.body[key] = value
      }
    })

    req.busboy.on('finish', () => {
      next()
    })
  }
}
