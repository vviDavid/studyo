const db = require('../database/config');

function fetchCourseGroupsByCourseId(course_id) {
    return db.prepare(
        `SELECT MIN(course_group.id) AS id,
        course_group.course_id,
        course_group.group_name,
        COUNT(course_group.course_member_id) AS member_count
        FROM course_group
        WHERE course_group.course_id = ?
        GROUP BY course_group.course_id, course_group.group_name
        ORDER BY course_group.group_name ASC`
    ).all(course_id);
}

function fetchCourseGroupById(group_id) {
    return db.prepare(
        `SELECT course_group.id,
        course_group.course_id,
        course_group.group_name,
        course.course_name
        FROM course_group
        JOIN course ON course_group.course_id = course.id
        WHERE course_group.id = ?`
    ).get(group_id);
}

function fetchCourseGroupMembers(course_id, group_name) {
    return db.prepare(
        `SELECT course_member.id AS course_member_id,
        learner.id AS learner_id,
        user.name AS learner_name,
        user.email AS learner_email
        FROM course_group
        JOIN course_member ON course_group.course_member_id = course_member.id
        JOIN learner ON course_member.learner_id = learner.id
        JOIN user ON learner.user_id = user.id
        WHERE course_group.course_id = ? AND course_group.group_name = ?
        ORDER BY user.name ASC`
    ).all(course_id, group_name);
}

function groupNameExistsInCourse(course_id, group_name) {
    const row = db.prepare(
        `SELECT id FROM course_group WHERE course_id = ? AND group_name = ? LIMIT 1`
    ).get(course_id, group_name);
    return !!row;
}

function createCourseGroup(course_id, member_ids, group_name) {
    const insertStmt = db.prepare(
        `INSERT INTO course_group (course_id, course_member_id, group_name)
        VALUES (?, ?, ?)`
    );

    const runBulkInsert = db.transaction((selectedMemberIds) => {
        selectedMemberIds.forEach((memberId) => {
            insertStmt.run(course_id, memberId, group_name);
        });
    });

    runBulkInsert(member_ids);
}

function deleteCourseGroup(course_id, group_name) {
    return db.prepare(
        `DELETE FROM course_group WHERE course_id = ? AND group_name = ?`
    ).run(course_id, group_name);
}

module.exports = {
    fetchCourseGroupsByCourseId,
    fetchCourseGroupById,
    fetchCourseGroupMembers,
    groupNameExistsInCourse,
    createCourseGroup,
    deleteCourseGroup,
};