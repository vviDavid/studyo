const fs = require('fs');
const path = require('path');

const CourseModel = require('../models/Course');
const CourseMemberModel = require('../models/CourseMember');
const CommentModel = require('../models/Comment');
const CourseGroupModel = require('../models/CourseGroup');
const db = require('../database/config');

function deleteUploadedImage(fileName) {
    if (!fileName) return;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
    if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
    }
}

function requireAdminAccess(req, res) {
    if (req.session.user_type !== 'admin') {
        res.status(403).render("pages/error", {
            title: "Unauthorized",
            message: "Only admins can manage courses."
        });
        return false;
    }
    return true;
}

function fetchMentorOptions() {
    return db.prepare(
        `SELECT mentor.id AS mentor_id, user.name, user.email
        FROM mentor
        JOIN user ON mentor.user_id = user.id
        ORDER BY user.name ASC`
    ).all();
}

function mentorExists(mentor_id) {
    const mentor = db.prepare(`SELECT id FROM mentor WHERE id = ?`).get(mentor_id);
    return !!mentor;
}

function validateCourse(course_name, mentor_id) {
    const errorMessage = [];

    if (!course_name || course_name.trim() === "") {
        errorMessage.push("Course name is required!");
    } else if (course_name.trim().length < 3) {
        errorMessage.push("Course name must be at least 3 characters long!");
    }

    if (mentor_id === undefined || mentor_id === null || mentor_id === "") {
        errorMessage.push("Please select a mentor for the course.");
    } else if (!mentorExists(mentor_id)) {
        errorMessage.push("Selected mentor does not exist.");
    }

    return errorMessage;
}

function showCourseList(req, res) {
    let courses;
    const { user_type, user_id } = req.session;

    if (user_type === 'admin') {
        courses = CourseModel.fetchAllCourses();
    } else if (user_type === 'mentor') {
        courses = CourseModel.fetchAllCoursesByMentorId(user_id);
    } else if (user_type === 'learner') {
        courses = CourseModel.fetchAllCoursesByLearnerId(user_id);
    }

    res.render("pages/course/list", {
        title: "Courses - Studyo",
        courses,
        user_type
    });
}

function showCreateCourse(req, res) {
    if (!requireAdminAccess(req, res)) return;

    const { user_type } = req.session;
    const LearnerModel = require('../models/Learner');

    const availableLearners = LearnerModel.fetchAllLearners();
    const mentors = fetchMentorOptions();

    res.render("pages/course/create", {
        title: "Create Course - Studyo",
        user_type,
        availableLearners,
        mentors
    });
}

function showEditCourse(req, res) {
    if (!requireAdminAccess(req, res)) return;

    const { id } = req.params;
    const { user_type } = req.session;
    const LearnerModel = require('../models/Learner');

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render("pages/error", {
            title: "Course Not Found",
            message: "The course you're looking for doesn't exist."
        });
    }

    const availableLearners = LearnerModel.fetchAllLearners();
    const mentors = fetchMentorOptions();
    const currentMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);
    const currentMemberIds = currentMembers.map(m => m.learner_id);

    // Mark which learners are already members
    const learnersWithSelection = availableLearners.map(learner => ({
        ...learner,
        isSelected: currentMemberIds.includes(learner.id)
    }));

    res.render("pages/course/edit", {
        title: `Edit ${course.course_name} - Studyo`,
        course,
        user_type,
        availableLearners: learnersWithSelection,
        mentors
    });
}

function showDeleteCourse(req, res) {
    if (!requireAdminAccess(req, res)) return;

    const { id } = req.params;
    const { user_type } = req.session;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render("pages/error", {
            title: "Course Not Found",
            message: "The course you're looking for doesn't exist."
        });
    }

    res.render("pages/course/delete", {
        title: `Delete ${course.course_name} - Studyo`,
        course,
        user_type
    });
}

function runCreateCourse(req, res) {
    if (!requireAdminAccess(req, res)) {
        if (req.file) deleteUploadedImage(req.file.filename);
        return;
    }

    const { course_name, course_desc, members, mentor_id } = req.body;
    const { user_type } = req.session;
    const course_pfp = req.file ? req.file.filename : null;

    const errorMessage = validateCourse(course_name, mentor_id);
    const selectedMentorId = parseInt(mentor_id, 10);

    if (!mentor_id || Number.isNaN(selectedMentorId) || !mentorExists(selectedMentorId)) {
        errorMessage.push("Please select a valid mentor.");
    }

    if (errorMessage.length > 0) {
        const LearnerModel = require('../models/Learner');
        const availableLearners = LearnerModel.fetchAllLearners();
        const mentors = fetchMentorOptions();
        return res.render("pages/course/create", {
            title: "Create Course - Studyo",
            user_type,
            errorMessage,
            formData: { course_name, course_desc, mentor_id: selectedMentorId },
            availableLearners,
            mentors
        });
    }

    try {
        const stmt = db.prepare(
            `INSERT INTO course (mentor_id, course_name, course_desc, course_pfp) 
            VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(selectedMentorId, course_name.trim(), course_desc.trim(), course_pfp);
        const courseId = result.lastInsertRowid;

        // Add members to course
        if (members && members.length > 0) {
            const memberIds = Array.isArray(members) ? members : [members];
            CourseMemberModel.createBulkCourseMember(courseId, memberIds);
        }

        res.redirect("/course/list");
    } catch (error) {
        console.error("Error creating course:", error);
        
        if (req.file) {
            deleteUploadedImage(req.file.filename);
        }

        const LearnerModel = require('../models/Learner');
        const availableLearners = LearnerModel.fetchAllLearners();
        const mentors = fetchMentorOptions();
        res.render("pages/course/create", {
            title: "Create Course - Studyo",
            user_type,
            errorMessage: ["An error occurred while creating the course. Please try again."],
            formData: { course_name, course_desc, mentor_id: selectedMentorId },
            availableLearners,
            mentors
        });
    }
}

function runEditCourse(req, res) {
    if (!requireAdminAccess(req, res)) {
        if (req.file) deleteUploadedImage(req.file.filename);
        return;
    }

    const { id } = req.params;
    const { course_name, course_desc, members, mentor_id } = req.body;
    const { user_type } = req.session;
    const course_pfp = req.file ? req.file.filename : null;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render("pages/error", {
            title: "Course Not Found",
            message: "The course you're looking for doesn't exist."
        });
    }

    const errorMessage = validateCourse(course_name, mentor_id);
    const selectedMentorId = parseInt(mentor_id, 10);

    if (!mentor_id || Number.isNaN(selectedMentorId) || !mentorExists(selectedMentorId)) {
        errorMessage.push("Please select a valid mentor.");
    }

    if (errorMessage.length > 0) {
        if (req.file) deleteUploadedImage(req.file.filename);
        const LearnerModel = require('../models/Learner');
        const availableLearners = LearnerModel.fetchAllLearners();
        const mentors = fetchMentorOptions();
        const currentMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);
        const currentMemberIds = currentMembers.map(m => m.learner_id);
        const learnersWithSelection = availableLearners.map(learner => ({
            ...learner,
            isSelected: currentMemberIds.includes(learner.id)
        }));
        return res.render("pages/course/edit", {
            title: `Edit ${course.course_name} - Studyo`,
            course: { ...course, course_name, course_desc, mentor_id: selectedMentorId },
            user_type,
            errorMessage,
            availableLearners: learnersWithSelection,
            mentors
        });
    }

    try {
        if (course_pfp && course.course_pfp) {
            deleteUploadedImage(course.course_pfp);
        }

        const newPfp = course_pfp || course.course_pfp;

        db.prepare(
            `UPDATE course SET mentor_id = ?, course_name = ?, course_desc = ?, course_pfp = ? WHERE id = ?`
        ).run(selectedMentorId, course_name.trim(), course_desc.trim(), newPfp, id);

        if (members) {
            const memberIds = Array.isArray(members) ? members : [members];
            CourseMemberModel.createBulkCourseMember(id, memberIds);
        } else {
            CourseMemberModel.deleteCourseMemberByCourseId(id);
        }

        res.redirect(`/course/${id}/detail`);
    } catch (error) {
        console.error("Error updating course:", error);
        if (req.file) deleteUploadedImage(req.file.filename);

        const LearnerModel = require('../models/Learner');
        const availableLearners = LearnerModel.fetchAllLearners();
        const mentors = fetchMentorOptions();
        const currentMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);
        const currentMemberIds = currentMembers.map(m => m.learner_id);
        const learnersWithSelection = availableLearners.map(learner => ({
            ...learner,
            isSelected: currentMemberIds.includes(learner.id)
        }));
        res.render("pages/course/edit", {
            title: `Edit ${course.course_name} - Studyo`,
            course,
            user_type,
            errorMessage: ["An error occurred while updating the course. Please try again."],
            availableLearners: learnersWithSelection,
            mentors
        });
    }
}

function runDeleteCourse(req, res) {
    if (!requireAdminAccess(req, res)) return;

    const { id } = req.params;
    const { user_type } = req.session;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render("pages/error", {
            title: "Course Not Found",
            message: "The course you're looking for doesn't exist."
        });
    }

    try {
        if (course.course_pfp) {
            deleteUploadedImage(course.course_pfp);
        }

        db.prepare(`DELETE FROM comment WHERE course_id = ?`).run(id);
        db.prepare(`DELETE FROM course_task WHERE course_content_id IN (SELECT id FROM course_content WHERE course_id = ?)`).run(id);
        db.prepare(`DELETE FROM course_content WHERE course_id = ?`).run(id);
        db.prepare(`DELETE FROM course_member WHERE course_id = ?`).run(id);
        db.prepare(`DELETE FROM course WHERE id = ?`).run(id);

        res.redirect("/course/list");
    } catch (error) {
        console.error("Error deleting course:", error);
        res.render("pages/course/delete", {
            title: `Delete ${course.course_name} - Studyo`,
            course,
            user_type,
            errorMessage: "An error occurred while deleting the course. Please try again."
        });
    }
}

function showCourseDetail(req, res) {
    const { id } = req.params;
    const { user_id, user_type } = req.session;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render("pages/error", {
            title: "Course Not Found",
            message: "The course you're looking for doesn't exist."
        });
    }

    const members = CourseMemberModel.fetchCourseMemberByCourseId(id);
    const comments = CommentModel.fetchCommentByCourseId(id);
    const courseContents = db.prepare(
        `SELECT * FROM course_content WHERE course_id = ? ORDER BY content_type, id ASC`
    ).all(id);

    let isEnrolled = false;
    if (user_type === 'learner') {
        const enrollment = db.prepare(
            `SELECT course_member.id FROM course_member
            JOIN learner ON course_member.learner_id = learner.id
            WHERE learner.user_id = ? AND course_member.course_id = ?`
        ).get(user_id, id);
        isEnrolled = !!enrollment;
    }

    const isMentor = user_type === 'mentor' && course.mentor_id === user_id;
    const isAdmin = user_type === 'admin';

    const commentsWithPermission = comments.map((comment) => ({
        ...comment,
        canDeleteComment: String(comment.user_id) === String(user_id)
    }));

    const groups = CourseGroupModel.fetchCourseGroupsByCourseId(id);

    res.render("pages/course/detail", {
        title: `${course.course_name} - Studyo`,
        course,
        members,
        comments: commentsWithPermission,
        courseContents,
        isEnrolled,
        isMentor,
        isAdmin,
        user_type,
        groups
    });
}

function addCourseComment(req, res) {
    const { id } = req.params;
    const { comment_body } = req.body;
    const { user_id, user_type } = req.session;

    if (!comment_body || comment_body.trim() === "") {
        return res.redirect(`/course/${id}/detail`);
    }

    try {
        CommentModel.createComment(user_id, id, comment_body.trim());
        res.redirect(`/course/${id}/detail`);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.redirect(`/course/${id}/detail`);
    }
}

function deleteCourseComment(req, res) {
    const { commentId } = req.params;
    const { user_id } = req.session;

    try {
        const comment = CommentModel.fetchCommentById(commentId);

        if (!comment) {
            return res.status(404).render("pages/error", {
                title: "Comment Not Found",
                message: "The comment you're trying to delete doesn't exist."
            });
        }

        const isCommentOwner = String(comment.user_id) === String(user_id);

        if (!isCommentOwner) {
            return res.status(403).render("pages/error", {
                title: "Unauthorized",
                message: "You can only delete your own comment."
            });
        }

        CommentModel.deleteComment(commentId);
        res.redirect(`/course/${comment.course_id}/detail`);
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).render("pages/error", {
            title: "Delete Failed",
            message: "Failed to delete comment. Please try again."
        });
    }
}

module.exports = {
    showCourseList,
    showCreateCourse,
    showEditCourse,
    showDeleteCourse,
    runCreateCourse,
    runEditCourse,
    runDeleteCourse,
    showCourseDetail,
    addCourseComment,
    deleteCourseComment
};