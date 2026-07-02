const multer = require('multer');
const { UPLOAD_MAX_FILE_SIZE_BYTES } = require('../config/constants');

const storage = multer.memoryStorage();

// The file buffers fully into memory before Cloudinary, so cap the size and
// accept only images. Oversize files raise a MulterError (413 via errorHandler).
module.exports = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    const e = new Error('Only image uploads are allowed');
    e.status = 422;
    cb(e);
  },
});
