const db = require('../database/config');

function fetchCourseMemberByCourseId(course_id) {
    return db.prepare(
        `SELECT course_member.id,
        learner.id AS learner_id,
        user.name AS learner_name,
        user.email AS learner_email
        FROM course_member
        JOIN learner ON course_member.learner_id = learner.id
        JOIN user ON learner.user_id = user.id
        WHERE course_member.course_id = ?
        ORDER BY user.name ASC`
    ).all(course_id);
}

function createCourseMember(learner_id, course_id) {
    const stmt = db.prepare(
        `INSERT INTO course_member (learner_id, course_id)
        VALUES (?, ?)`
    );
    return stmt.run(learner_id, course_id);
}

function deleteCourseMember(id) {
    const stmt = db.prepare(
        `DELETE FROM course_member WHERE id = ?`
    );
    return stmt.run(id);
}

function deleteCourseMemberByCourseId(course_id) {
    const stmt = db.prepare(
        `DELETE FROM course_member WHERE course_id = ?`
    );
    return stmt.run(course_id);
}

function createBulkCourseMember(course_id, learner_ids) {
    deleteCourseMemberByCourseId(course_id);

    if (learner_ids && learner_ids.length > 0) {
        const stmt = db.prepare(
            `INSERT INTO course_member (learner_id, course_id)
            VALUES (?, ?)`
        );
        learner_ids.forEach(learner_id => {
            stmt.run(learner_id, course_id);
        });
    }
}

module.exports = {
    fetchCourseMemberByCourseId,
    createCourseMember,
    deleteCourseMember,
    deleteCourseMemberByCourseId,
    createBulkCourseMember
}