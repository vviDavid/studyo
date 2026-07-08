const db = require('../database/config');

function fetchAllCourseContents() {
    return db.prepare(
        `SELECT course_content.id, course_content.course_id, course_content.content_type,
        course_content.content_title, course_content.content_body,
        course.course_name
        FROM course_content
        JOIN course ON course_content.course_id = course.id
        ORDER BY course_content.id ASC`
    ).all();
}

function fetchCourseContentById(id) {
    return db.prepare(
        `SELECT course_content.id, course_content.course_id, course_content.content_type,
        course_content.content_title, course_content.content_body,
        course.course_name
        FROM course_content
        JOIN course ON course_content.course_id = course.id
        WHERE course_content.id = ?`
    ).get(id);
}

function createCourseContent(course_id, content_type, content_title, content_body) {
    const stmt = db.prepare(
        `INSERT INTO course_content (course_id, content_type, content_title, content_body)
        VALUES (?, ?, ?, ?)`
    );
    return stmt.run(course_id, content_type, content_title, content_body);
}

function updateCourseContent(id, content_title, content_body) {
    const stmt = db.prepare(
        `UPDATE course_content
        SET content_title = ?, content_body = ?
        WHERE id = ?`
    );
    return stmt.run(content_title, content_body, id);
}

function deleteCourseContent(id) {
    const stmt = db.prepare(
        `DELETE FROM course_content WHERE id = ?`
    );
    return stmt.run(id);
}

module.exports = {
    fetchAllCourseContents,
    fetchCourseContentById,
    createCourseContent,
    updateCourseContent,
    deleteCourseContent
}