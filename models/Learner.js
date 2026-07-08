const db = require('../database/config');

const bcrypt = require('bcrypt');

function fetchAllLearners() {
    return db.prepare(
        `SELECT learner.id, user.id AS user_id, user.name, user.email, user.birthday, user.pfp, user.created_at, user.updated_at, learner.grade
        FROM learner
        JOIN user ON learner.user_id = user.id`
    ).all();
}

function fetchLearnerById(id) {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.birthday, user.pfp, learner.grade
        FROM learner
        JOIN user ON learner.user_id = user.id
        WHERE user.id = ?`
    ).get(id);
}

function createLearner(name, email, birthday, pfp, grade) {
    const userStmt = db.prepare(
        `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
        VALUES (?, ?, ?, ?, ?, ?)`
    );
    result = userStmt.run(name, email, bcrypt.hashSync(email, 10), 'learner', birthday, pfp);

    const userId = result.lastInsertRowid;

    const learnerStmt = db.prepare(
        `INSERT INTO learner (user_id, grade)
        VALUES (?, ?)`
    );
    learnerStmt.run(userId, grade);
}

function updateLearner(id, name, email, birthday, pfp, grade) {
    const userStmt = db.prepare(
        `UPDATE user
        SET name = ?, email = ?, birthday = ?, pfp = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    );
    userStmt.run(name, email, birthday, pfp, id);

    const learnerStmt = db.prepare(
        `UPDATE learner
        SET grade = ?
        WHERE user_id = ?`
    );
    learnerStmt.run(grade, id);
}

function deleteLearner(id) {
    const stmt = db.prepare(
        `DELETE FROM user WHERE id = ?`
    );
    stmt.run(id);
}

module.exports = {
    fetchAllLearners,
    fetchLearnerById,
    createLearner,
    updateLearner,
    deleteLearner
};