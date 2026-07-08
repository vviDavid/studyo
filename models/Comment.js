const db = require('../database/config');

function fetchCommentByCourseId(course_id) {
    return db.prepare(
        `SELECT comment.id, comment.comment_body,
        comment.created_at, comment.user_id, user.name, user.pfp
        FROM comment
        JOIN user ON comment.user_id = user.id
        WHERE comment.course_id = ?
        ORDER BY comment.created_at DESC`
    ).all(course_id);
}

function fetchCommentById(id) {
    return db.prepare(
        `SELECT id, user_id, course_id, comment_body, created_at
        FROM comment
        WHERE id = ?`
    ).get(id);
}

function createComment(user_id, course_id, comment_body) {
    const stmt = db.prepare(
        `INSERT INTO comment (user_id, course_id, comment_body)
        VALUES (?, ?, ?)`
    );
    return stmt.run(user_id, course_id, comment_body);
}

function deleteComment(id) {
    const stmt = db.prepare(
        `DELETE FROM comment WHERE id = ?`
    );
    return stmt.run(id);
}

module.exports = {
    fetchCommentByCourseId,
    fetchCommentById,
    createComment,
    deleteComment
}