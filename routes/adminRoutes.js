const router = require('express').Router();

const AdminController = require('../controllers/adminController');
const { upload } = require('../config/upload');

router.get('/create', AdminController.showCreateAdmin);

router.get('/list', AdminController.showAdminList);

router.get('/edit/:id', AdminController.showEditAdmin);

router.post('/create', upload.single('pfp'), AdminController.runCreateAdmin);

router.post('/edit/:id', upload.single('pfp'), AdminController.runEditAdmin);

router.post('/delete/:id', AdminController.runDeleteAdmin);

module.exports = router;