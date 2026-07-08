const db = require('../database/config');

function createCourseTask(course_id, content_type, content_title, content_body) {
    const contentStmt = db.prepare(
        `INSERT INTO course_content (course_id, content_type, content_title, content_body)
        VALUES (?, ?, ?, ?)`
    );
    const contentResult = contentStmt.run(course_id, content_type, content_title, content_body);

    const taskStmt = db.prepare(
        `INSERT INTO course_task (course_content_id, task_status)
        VALUES (?, ?)`
    );
    return taskStmt.run(contentResult.lastInsertRowid, 'incomplete');
}

function submitCourseTask(id, task_submittance) {
    const stmt = db.prepare(
        `UPDATE course_task
        SET task_submittance = ?, task_status = ?
        WHERE id = ?`
    );
    return stmt.run(task_submittance,'submitted', id);
}

function gradeCourseTask(id, task_score) {
    const stmt = db.prepare(
        `UPDATE course_task
        SET task_score = ?, task_status = ?
        WHERE id = ?`
    );
    return stmt.run(task_score, 'graded', id);
}

module.exports = {
    fetchAllCourseTasks,
    fetchCourseTaskById,
    createCourseTask,
    submitCourseTask,
    gradeCourseTask
}