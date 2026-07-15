const router = require('express').Router();

const ProfileController = require('../controllers/profileController');
const { upload } = require('../config/upload');

router.get('/', ProfileController.showProfileBio);

router.get('/edit', ProfileController.showEditProfile);

router.post('/edit', upload.single('pfp'), ProfileController.runEditProfile);

module.exports = router;
