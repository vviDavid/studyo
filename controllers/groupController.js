const CourseModel = require('../models/Course');
const CourseMemberModel = require('../models/CourseMember');
const CourseGroupModel = require('../models/CourseGroup');
const db = require('../database/config');

function getMentorIdByUserId(user_id) {
    return db.prepare(`SELECT id FROM mentor WHERE user_id = ?`).get(user_id)?.id;
}

function canManageCourseGroup(user_type, user_id, course) {
    if (user_type !== 'mentor') return true;

    const mentorId = getMentorIdByUserId(user_id);
    return String(course.mentor_id) === String(mentorId);
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

function showGroupDetail(req, res) {
    const { id, groupId } = req.params;
    const { user_id, user_type } = req.session;
    const group = CourseGroupModel.fetchCourseGroupById(groupId);

    if (!group || String(group.course_id) !== String(id)) {
        return res.status(404).render('pages/error', {
            title: 'Group Not Found',
            message: "The group you're looking for doesn't exist."
        });
    }

    const members = CourseGroupModel.fetchCourseGroupMembers(group.course_id, group.group_name);
    const course = CourseModel.fetchCourseById(group.course_id);
    const canManageGroup = !!course && canManageCourseGroup(user_type, user_id, course);
    const canViewAsLearner = user_type !== 'learner' || isLearnerEnrolledInCourse(user_id, group.course_id);

    if (!canViewAsLearner) {
        return res.status(403).render('pages/error', {
            title: 'Unauthorized',
            message: 'Only enrolled learners can view this group.'
        });
    }

    res.render('pages/course/group/detail', {
        title: `${group.group_name} - Studyo`,
        group,
        members,
        canManageGroup
    });
}

function showCreateCourseGroup(req, res) {
    const { id } = req.params;
    const { user_id, user_type } = req.session;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render('pages/error', {
            title: 'Course Not Found',
            message: "The course you're looking for doesn't exist."
        });
    }

    if (!canManageCourseGroup(user_type, user_id, course)) {
        return res.status(403).render('pages/error', {
            title: 'Unauthorized',
            message: 'Only the assigned mentor or an admin can manage groups in this course.'
        });
    }

    const courseMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);

    res.render('pages/course/group/create', {
        title: `Create Group - ${course.course_name}`,
        course,
        courseMembers,
        formData: {
            group_name: '',
            member_ids: []
        }
    });
}

function runCreateCourseGroup(req, res) {
    const { id } = req.params;
    const { user_id, user_type } = req.session;
    const { group_name, member_ids } = req.body;

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render('pages/error', {
            title: 'Course Not Found',
            message: "The course you're looking for doesn't exist."
        });
    }

    if (!canManageCourseGroup(user_type, user_id, course)) {
        return res.status(403).render('pages/error', {
            title: 'Unauthorized',
            message: 'Only the assigned mentor or an admin can manage groups in this course.'
        });
    }

    const selectedMemberIds = Array.isArray(member_ids)
        ? member_ids
        : (member_ids ? [member_ids] : []);

    const parsedMemberIds = [...new Set(selectedMemberIds
        .map((memberId) => parseInt(memberId, 10))
        .filter((memberId) => !Number.isNaN(memberId)))];

    const normalizedGroupName = (group_name || '').trim();
    const errorMessage = [];

    if (!normalizedGroupName) {
        errorMessage.push('Group name is required.');
    }

    if (parsedMemberIds.length === 0) {
        errorMessage.push('Select at least one course member for this group.');
    }

    if (normalizedGroupName && CourseGroupModel.groupNameExistsInCourse(id, normalizedGroupName)) {
        errorMessage.push('A group with that name already exists in this course.');
    }

    const validMemberRows = db.prepare(
        `SELECT id FROM course_member WHERE course_id = ?`
    ).all(id);
    const validMemberIdSet = new Set(validMemberRows.map((row) => row.id));
    const hasInvalidMember = parsedMemberIds.some((memberId) => !validMemberIdSet.has(memberId));

    if (hasInvalidMember) {
        errorMessage.push('One or more selected members are not part of this course.');
    }

    if (errorMessage.length > 0) {
        const courseMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);

        return res.render('pages/course/group/create', {
            title: `Create Group - ${course.course_name}`,
            course,
            courseMembers,
            errorMessage,
            formData: {
                group_name: normalizedGroupName,
                member_ids: parsedMemberIds.map(String)
            }
        });
    }

    try {
        CourseGroupModel.createCourseGroup(id, parsedMemberIds, normalizedGroupName);
        res.redirect(`/course/${id}/detail#course-groups`);
    } catch (error) {
        console.error('Error creating course group:', error);

        const courseMembers = CourseMemberModel.fetchCourseMemberByCourseId(id);

        res.render('pages/course/group/create', {
            title: `Create Group - ${course.course_name}`,
            course,
            courseMembers,
            errorMessage: ['An error occurred while creating the group. Please try again.'],
            formData: {
                group_name: normalizedGroupName,
                member_ids: parsedMemberIds.map(String)
            }
        });
    }
}

function runDeleteCourseGroup(req, res) {
    const { id, groupId } = req.params;
    const { user_id, user_type } = req.session;

    const group = CourseGroupModel.fetchCourseGroupById(groupId);

    if (!group || String(group.course_id) !== String(id)) {
        return res.status(404).render('pages/error', {
            title: 'Group Not Found',
            message: "The group you're trying to delete doesn't exist."
        });
    }

    const course = CourseModel.fetchCourseById(id);

    if (!course) {
        return res.status(404).render('pages/error', {
            title: 'Course Not Found',
            message: "The course you're looking for doesn't exist."
        });
    }

    if (!canManageCourseGroup(user_type, user_id, course)) {
        return res.status(403).render('pages/error', {
            title: 'Unauthorized',
            message: 'Only the assigned mentor or an admin can delete groups in this course.'
        });
    }

    try {
        CourseGroupModel.deleteCourseGroup(group.course_id, group.group_name);
        res.redirect(`/course/${id}/detail#course-groups`);
    } catch (error) {
        console.error('Error deleting course group:', error);
        res.status(500).render('pages/error', {
            title: 'Delete Failed',
            message: 'Failed to delete group. Please try again.'
        });
    }
}

module.exports = {
    showGroupDetail,
    showCreateCourseGroup,
    runCreateCourseGroup,
    runDeleteCourseGroup
};