const router = require('express').Router();

const CourseController = require('../controllers/courseController');
const { upload } = require('../config/upload');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/create', authorize('admin'), CourseController.showCreateCourse);

router.get('/list', CourseController.showCourseList);

router.get('/:id/edit', authorize('admin'), CourseController.showEditCourse);

router.get('/:id/delete', authorize('admin'), CourseController.showDeleteCourse);

router.get('/:id/detail', CourseController.showCourseDetail);

router.post('/create', authorize('admin'), upload.single('course_pfp'), CourseController.runCreateCourse);

router.post('/:id/edit', authorize('admin'), upload.single('course_pfp'), CourseController.runEditCourse);

router.post('/:id/delete', authorize('admin'), CourseController.runDeleteCourse);

router.post('/:id/comment', authorize('learner', 'mentor'), CourseController.addCourseComment);

router.post('/comments/:commentId/delete', authorize('learner', 'mentor'), CourseController.deleteCourseComment);

module.exports = router;