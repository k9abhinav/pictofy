const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads');
  },
  filename: function (req, file, cb) {
    const unique = uuidv4() + path.extname(file.originalname);
    cb(null, unique);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;