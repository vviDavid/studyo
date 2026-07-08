const router = require('express').Router();

const LearnerController = require('../controllers/learnerController');
const { upload } = require('../config/upload');

router.get('/create', LearnerController.showCreateLearner);

router.get('/list', LearnerController.showLearnerList);

router.get('/edit/:id', LearnerController.showEditLearner);

router.post('/create', upload.single('pfp'), LearnerController.runCreateLearner);

router.post('/edit/:id', upload.single('pfp'), LearnerController.runEditLearner);

router.post('/delete/:id', LearnerController.runDeleteLearner);

module.exports = router;