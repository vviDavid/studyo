const db = require('../database/config');

function fetchAllCourses() {
    return db.prepare(
        `SELECT course.id, course.mentor_id, course.course_name, course.course_desc, course.course_pfp,
        user.name AS mentor_name,
        user.email AS mentor_email,
        user.pfp AS mentor_pfp,
        COUNT(course_member.id) AS member_count
        FROM course
        JOIN mentor ON course.mentor_id = mentor.id
        JOIN user ON mentor.user_id = user.id
        LEFT JOIN course_member ON course.id = course_member.course_id
        GROUP BY course.id
        ORDER BY course.course_name ASC`
    ).all();
}

function fetchCourseById(id) {
    return db.prepare(
        `SELECT course.id, course.mentor_id, course.course_name, course.course_desc, course.course_pfp,
        user.name AS mentor_name,
        user.email AS mentor_email,
        user.pfp AS mentor_pfp,
        COUNT(course_member.id) AS member_count
        FROM course
        JOIN mentor ON course.mentor_id = mentor.id
        JOIN user ON mentor.user_id = user.id
        LEFT JOIN course_member ON course.id = course_member.course_id
        WHERE course.id = ?
        GROUP BY course.id`
    ).get(id);
}

function fetchAllCoursesByMentorId(mentor_id) {
    return db.prepare(
        `SELECT course.id, course.mentor_id, course.course_name, course.course_desc, course.course_pfp,
        user.name AS mentor_name,
        user.email AS mentor_email,
        user.pfp AS mentor_pfp,
        COUNT(course_member.id) AS member_count
        FROM course
        JOIN mentor ON course.mentor_id = mentor.id
        JOIN user ON mentor.user_id = user.id
        LEFT JOIN course_member ON course.id = course_member.course_id
        WHERE user.id = ?
        GROUP BY course.id`
    ).all(mentor_id);
}

function fetchAllCoursesByLearnerId(learner_id) {
    return db.prepare(
        `SELECT course.id, course.mentor_id, course.course_name, course.course_desc, course.course_pfp,
        user.name AS mentor_name,
        user.email AS mentor_email,
        user.pfp AS mentor_pfp,
        COUNT(course_member.id) AS member_count
        FROM course
        JOIN mentor ON course.mentor_id = mentor.id
        JOIN user ON mentor.user_id = user.id
        LEFT JOIN course_member ON course.id = course_member.course_id
        WHERE course.id IN (
            SELECT course_id FROM course_member 
            JOIN learner ON course_member.learner_id = learner.id
            WHERE learner.user_id = ?
        )
        GROUP BY course.id
        ORDER BY course.course_name ASC`
    ).all(learner_id);
}

function createCourse(mentor_id, course_name, course_desc, course_pfp) {
    const stmt = db.prepare(
        `INSERT INTO course (mentor_id, course_name, course_desc, course_pfp)
        VALUES (?, ?, ?, ?)`
    );
    return stmt.run(mentor_id, course_name, course_desc, course_pfp);
}

function updateCourse(id, mentor_id, course_name, course_desc, course_pfp) {
    const stmt = db.prepare(
        `UPDATE course
        SET mentor_id = ?, course_name = ?, course_desc = ?, course_pfp = ?
        WHERE id = ?`
    );
    return stmt.run(mentor_id, course_name, course_desc, course_pfp, id);
}

function deleteCourse(id) {
    const stmt = db.prepare(
        `DELETE FROM course WHERE id = ?`
    );
    return stmt.run(id);
}

module.exports = {
    fetchAllCourses,
    fetchCourseById,
    fetchAllCoursesByMentorId,
    fetchAllCoursesByLearnerId,
    createCourse,
    updateCourse,
    deleteCourse
}