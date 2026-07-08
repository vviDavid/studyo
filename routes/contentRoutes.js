const router = require('express').Router({ mergeParams: true });

const ContentController = require('../controllers/contentController');
const { taskUpload } = require('../config/upload');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/create', authorize('mentor'), ContentController.showCreateCourseContent);

router.get('/:content_id/detail', ContentController.showCourseContentDetail);

router.post('/create', authorize('mentor'), ContentController.runCreateCourseContent);

router.post('/:content_id/delete', authorize('mentor', 'admin'), ContentController.runDeleteCourseContent);

router.post('/:content_id/submit', authorize('learner'), taskUpload.single('task_file'), ContentController.runSubmitTaskContent);

router.post('/:content_id/grade/:course_member_id', authorize('mentor'), ContentController.runGradeTaskContent);

module.exports = router;