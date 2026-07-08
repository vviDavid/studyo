const router = require('express').Router();

const MentorController = require('../controllers/mentorController');
const { upload } = require('../config/upload');

router.get('/create', MentorController.showCreateMentor);

router.get('/list', MentorController.showMentorList);

router.get('/edit/:id', MentorController.showEditMentor);

router.post('/create', upload.single('pfp'), MentorController.runCreateMentor);

router.post('/edit/:id', upload.single('pfp'), MentorController.runEditMentor);

router.post('/delete/:id', MentorController.runDeleteMentor);

module.exports = router;