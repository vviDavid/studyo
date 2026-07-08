const router = require('express').Router({ mergeParams: true });

const GroupController = require('../controllers/groupController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/create', authorize('mentor'), GroupController.showCreateCourseGroup);

router.get('/:groupId/detail', GroupController.showGroupDetail);

router.post('/create', authorize('mentor'), GroupController.runCreateCourseGroup);

router.post('/:groupId/delete', authorize('mentor'), GroupController.runDeleteCourseGroup);

module.exports = router;