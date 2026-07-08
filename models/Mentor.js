const db = require('../database/config');

const bcrypt = require('bcrypt');

function fetchAllMentors() {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.birthday, user.pfp, user.created_at, user.updated_at, mentor.expertise
        FROM mentor
        JOIN user ON mentor.user_id = user.id
        ORDER BY user.name DESC`
    ).all();
}

function fetchMentorById(id) {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.birthday, user.pfp, mentor.expertise
        FROM mentor
        JOIN user ON mentor.user_id = user.id
        WHERE user.id = ?`
    ).get(id);
}

function createMentor(name, email, birthday, pfp, expertise) {
    const userStmt = db.prepare(
        `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
        VALUES (?, ?, ?, ?, ?, ?)`
    );
    result = userStmt.run(name, email, bcrypt.hashSync(email, 10), 'mentor', birthday, pfp);

    const userId = result.lastInsertRowid;

    const mentorStmt = db.prepare(
        `INSERT INTO mentor (user_id, expertise)
        VALUES (?, ?)`
    );
    mentorStmt.run(userId, expertise);
}

function updateMentor(id, name, email, birthday, pfp, expertise) {
    const userStmt = db.prepare(
        `UPDATE user
        SET name = ?, email = ?, birthday = ?, pfp = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    );
    userStmt.run(name, email, birthday, pfp, id);

    const mentorStmt = db.prepare(
        `UPDATE mentor
        SET expertise = ?
        WHERE user_id = ?`
    );
    mentorStmt.run(expertise, id);
}

function deleteMentor(id) {
    const stmt = db.prepare(
        `DELETE FROM user WHERE id = ?`
    );
    stmt.run(id);
}

module.exports = {
    fetchAllMentors,
    fetchMentorById,
    createMentor,
    updateMentor,
    deleteMentor
};