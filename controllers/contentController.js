const fs = require('fs');
const path = require('path');

const CourseModel = require('../models/Course');
const CourseContentModel = require('../models/CourseContent');
const db = require('../database/config');

function deleteUploadedFile(fileName) {
	if (!fileName) return;
	const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
	if (fs.existsSync(uploadPath)) {
		fs.unlinkSync(uploadPath);
	}
}

function getMentorIdByUserId(user_id) {
	return db.prepare(`SELECT id FROM mentor WHERE user_id = ?`).get(user_id)?.id;
}

function getCourseMemberByUserAndCourse(user_id, course_id) {
	return db.prepare(
		`SELECT course_member.id, course_member.learner_id
		FROM course_member
		JOIN learner ON course_member.learner_id = learner.id
		WHERE learner.user_id = ? AND course_member.course_id = ?`
	).get(user_id, course_id);
}

function isLearnerEnrolledInCourse(user_id, course_id) {
	const membership = db.prepare(
		`SELECT course_member.id
		FROM course_member
		JOIN learner ON course_member.learner_id = learner.id
		WHERE learner.user_id = ? AND course_member.course_id = ?`
	).get(user_id, course_id);
	return !!membership;
}

function validateContent(contentName, contentDesc, contentType) {
	const errorMessage = [];

	if (!contentName || contentName.trim() === '') {
		errorMessage.push('Content name is required.');
	}

	if (!contentDesc || contentDesc.trim() === '') {
		errorMessage.push('Content description is required.');
	}

	if (!['subject', 'task'].includes(contentType)) {
		errorMessage.push('Please choose a valid content type.');
	}

	return errorMessage;
}

function showCourseContentDetail(req, res) {
	const { id, content_id } = req.params;
	const { user_id, user_type } = req.session;

	const course = CourseModel.fetchCourseById(id);
	const content = CourseContentModel.fetchCourseContentById(content_id);

	if (!course || !content) {
		return res.status(404).render('pages/error', {
			title: 'Content Not Found',
			message: "The content you're looking for doesn't exist."
		});
	}

	const detail = content;
	const mentorId = getMentorIdByUserId(user_id);
	const learnerCourseMember = getCourseMemberByUserAndCourse(user_id, id);
	const learnerTask = detail.content_type === 'task' && learnerCourseMember
		? db.prepare(
			`SELECT task_submittance, task_status, task_score
			FROM course_task
			WHERE course_content_id = ? AND course_member_id = ?`
		).get(content_id, learnerCourseMember.id)
		: null;

	const canViewMentorRack = detail.content_type === 'task'
		&& user_type === 'mentor'
		&& String(course.mentor_id) === String(mentorId);

	const mentorTaskSubmittances = canViewMentorRack
		? db.prepare(
			`SELECT course_member.id AS course_member_id,
			learner.id AS learner_id,
			user.name AS learner_name,
			user.email AS learner_email,
			course_task.task_submittance,
			COALESCE(course_task.task_status, 'incomplete') AS task_status,
			course_task.task_score
			FROM course_member
			JOIN learner ON course_member.learner_id = learner.id
			JOIN user ON learner.user_id = user.id
			LEFT JOIN course_task
			ON course_task.course_member_id = course_member.id
			AND course_task.course_content_id = ?
			WHERE course_member.course_id = ?
			ORDER BY user.name ASC`
		).all(content_id, id)
		: [];

	const canSubmitTask = detail.content_type === 'task'
		&& user_type === 'learner'
		&& isLearnerEnrolledInCourse(user_id, id)
		&& String(learnerTask?.task_status || 'incomplete') !== 'graded';

	const normalizedContent = {
		...detail,
		task_status: detail.content_type === 'task' ? (learnerTask?.task_status || 'incomplete') : null,
		task_score: detail.content_type === 'task' ? (learnerTask?.task_score ?? '-') : null,
		task_submittance: detail.content_type === 'task' ? (learnerTask?.task_submittance || null) : null
	};

	res.render('pages/course/content/detail', {
		title: `${normalizedContent.content_title} - Studyo`,
		course,
		content: normalizedContent,
		canSubmitTask,
		canViewMentorRack,
		mentorTaskSubmittances,
		successMessage: req.query.success,
		errorMessage: req.query.error
	});
}

function showCreateCourseContent(req, res) {
	const { id } = req.params;
	const course = CourseModel.fetchCourseById(id);

	if (!course) {
		return res.status(404).render('pages/error', {
			title: 'Course Not Found',
			message: "The course you're looking for doesn't exist."
		});
	}

	res.render('pages/course/content/create', {
		title: `Create Content - ${course.course_name}`,
		course,
		user_type: req.session.user_type,
		formData: {
			content_name: '',
			content_desc: '',
			content_type: 'subject'
		}
	});
}

function runCreateCourseContent(req, res) {
	const { id } = req.params;
	const { content_name, content_desc, content_type } = req.body;

	const course = CourseModel.fetchCourseById(id);

	if (!course) {
		return res.status(404).render('pages/error', {
			title: 'Course Not Found',
			message: "The course you're looking for doesn't exist."
		});
	}

	const errorMessage = validateContent(content_name, content_desc, content_type);

	if (errorMessage.length > 0) {
		return res.render('pages/course/content/create', {
			title: `Create Content - ${course.course_name}`,
			course,
			user_type: req.session.user_type,
			errorMessage,
			formData: {
				content_name,
				content_desc,
				content_type
			}
		});
	}

	try {
		const contentResult = db.prepare(
			`INSERT INTO course_content (course_id, content_type, content_title, content_body)
			VALUES (?, ?, ?, ?)`
		).run(id, content_type, content_name.trim(), content_desc.trim());

		if (content_type === 'task') {
			const courseMembers = db.prepare(
				`SELECT id FROM course_member WHERE course_id = ?`
			).all(id);

			const insertTaskStmt = db.prepare(
				`INSERT INTO course_task (course_content_id, course_member_id, task_submittance, task_status, task_score)
				VALUES (?, ?, ?, ?, ?)`
			);

			courseMembers.forEach((member) => {
				insertTaskStmt.run(contentResult.lastInsertRowid, member.id, null, 'incomplete', null);
			});
		}

		res.redirect(`/course/${id}/detail#course-content`);
	} catch (error) {
		console.error('Error creating content:', error);
		res.render('pages/course/content/create', {
			title: `Create Content - ${course.course_name}`,
			course,
			user_type: req.session.user_type,
			errorMessage: ['An error occurred while creating the content. Please try again.'],
			formData: {
				content_name,
				content_desc,
				content_type
			}
		});
	}
}

function runDeleteCourseContent(req, res) {
	const { id, content_id } = req.params;
	const course = CourseModel.fetchCourseById(id);
	const content = CourseContentModel.fetchCourseContentById(content_id);

	if (!course || !content || String(content.course_id) !== String(id)) {
		return res.status(404).render('pages/error', {
			title: 'Content Not Found',
			message: "The content you're looking for doesn't exist."
		});
	}

	try {
		if (content.content_type === 'task') {
			const currentTasks = db.prepare(
				`SELECT task_submittance FROM course_task WHERE course_content_id = ?`
			).all(content_id);

			currentTasks.forEach((task) => {
				if (task?.task_submittance) {
					deleteUploadedFile(task.task_submittance);
				}
			});

			db.prepare(`DELETE FROM course_task WHERE course_content_id = ?`).run(content_id);
		}

		db.prepare(`DELETE FROM course_content WHERE id = ?`).run(content_id);

		res.redirect(`/course/${id}/detail`);
	} catch (error) {
		console.error('Error deleting content:', error);
		res.render('pages/error', {
			title: 'Delete Failed',
			message: 'An error occurred while deleting the content. Please try again.'
		});
	}
}

function runSubmitTaskContent(req, res) {
	const { id, content_id } = req.params;
	const { user_id, user_type } = req.session;

	const course = CourseModel.fetchCourseById(id);
	const content = CourseContentModel.fetchCourseContentById(content_id);

	if (!course || !content || String(content.course_id) !== String(id) || content.content_type !== 'task') {
		if (req.file) deleteUploadedFile(req.file.filename);
		return res.status(404).render('pages/error', {
			title: 'Content Not Found',
			message: "The task you're looking for doesn't exist."
		});
	}

	if (user_type !== 'learner' || !isLearnerEnrolledInCourse(user_id, id)) {
		if (req.file) deleteUploadedFile(req.file.filename);
		return res.status(403).render('pages/error', {
			title: 'Unauthorized',
			message: 'Only enrolled learners can submit this task.'
		});
	}

	const learnerCourseMember = getCourseMemberByUserAndCourse(user_id, id);
	if (!learnerCourseMember) {
		if (req.file) deleteUploadedFile(req.file.filename);
		return res.status(403).render('pages/error', {
			title: 'Unauthorized',
			message: 'Only enrolled learners can submit this task.'
		});
	}

	const currentTask = db.prepare(
		`SELECT task_status FROM course_task WHERE course_content_id = ? AND course_member_id = ?`
	).get(content_id, learnerCourseMember.id);
	if ((currentTask?.task_status || 'incomplete') === 'graded') {
		if (req.file) deleteUploadedFile(req.file.filename);
		return res.redirect(`/course/${id}/content/${content_id}/detail?error=This+task+has+already+been+graded+and+cannot+be+resubmitted.`);
	}

	if (!req.file) {
		return res.redirect(`/course/${id}/content/${content_id}/detail?error=Please+choose+a+file+to+submit.`);
	}

	try {
		const existingTask = db.prepare(
			`SELECT task_submittance FROM course_task WHERE course_content_id = ? AND course_member_id = ?`
		).get(content_id, learnerCourseMember.id);

		if (existingTask?.task_submittance && existingTask.task_submittance !== req.file.filename) {
			deleteUploadedFile(existingTask.task_submittance);
		}

		if (!existingTask) {
			db.prepare(
				`INSERT INTO course_task (course_content_id, course_member_id, task_submittance, task_status, task_score)
				VALUES (?, ?, ?, ?, ?)`
			).run(content_id, learnerCourseMember.id, req.file.filename, 'submitted', null);
		} else {
			db.prepare(
				`UPDATE course_task
				SET task_submittance = ?, task_status = ?
				WHERE course_content_id = ? AND course_member_id = ?`
			).run(req.file.filename, 'submitted', content_id, learnerCourseMember.id);
		}

		res.redirect(`/course/${id}/content/${content_id}/detail?success=Task+file+submitted+successfully.`);
	} catch (error) {
		console.error('Error submitting task file:', error);
		deleteUploadedFile(req.file.filename);
		res.redirect(`/course/${id}/content/${content_id}/detail?error=Failed+to+submit+task+file.`);
	}
}

function runGradeTaskContent(req, res) {
	const { id, content_id, course_member_id } = req.params;
	const { user_id, user_type } = req.session;
	const { task_score } = req.body;

	const course = CourseModel.fetchCourseById(id);
	const content = CourseContentModel.fetchCourseContentById(content_id);

	if (!course || !content || String(content.course_id) !== String(id) || content.content_type !== 'task') {
		return res.status(404).render('pages/error', {
			title: 'Content Not Found',
			message: "The task you're looking for doesn't exist."
		});
	}

	const mentorId = getMentorIdByUserId(user_id);
	const canGrade = user_type === 'mentor' && String(course.mentor_id) === String(mentorId);

	if (!canGrade) {
		return res.status(403).render('pages/error', {
			title: 'Unauthorized',
			message: 'Only the assigned mentor can grade this task.'
		});
	}

	const member = db.prepare(
		`SELECT id FROM course_member WHERE id = ? AND course_id = ?`
	).get(course_member_id, id);

	if (!member) {
		return res.redirect(`/course/${id}/content/${content_id}/detail?error=Invalid+course+member+for+this+task.`);
	}

	const parsedScore = Number(task_score);
	if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
		return res.redirect(`/course/${id}/content/${content_id}/detail?error=Task+score+must+be+a+number+between+0+and+100.`);
	}

	try {
		const selectedTask = db.prepare(
			`SELECT task_submittance FROM course_task WHERE course_content_id = ? AND course_member_id = ?`
		).get(content_id, course_member_id);

		if (!selectedTask?.task_submittance) {
			return res.redirect(`/course/${id}/content/${content_id}/detail?error=This+member+has+not+submitted+their+task+yet.`);
		}

		db.prepare(
			`UPDATE course_task
			SET task_score = ?, task_status = ?
			WHERE course_content_id = ? AND course_member_id = ?`
		).run(parsedScore, 'graded', content_id, course_member_id);

		res.redirect(`/course/${id}/content/${content_id}/detail?success=Task+graded+successfully.`);
	} catch (error) {
		console.error('Error grading task:', error);
		res.redirect(`/course/${id}/content/${content_id}/detail?error=Failed+to+grade+task.`);
	}
}

module.exports = {
	showCourseContentDetail,
	showCreateCourseContent,
	runCreateCourseContent,
	runDeleteCourseContent,
	runSubmitTaskContent,
	runGradeTaskContent
};