const db = require('../database/config');

const bcrypt = require('bcrypt');

function fetchAllAdmins() {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.birthday, user.pfp, user.created_at, user.updated_at
        FROM user
        WHERE user_type = 'admin'`
    ).all();
}

function fetchAdminById(id) {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.birthday, user.pfp
        FROM user
        WHERE id = ?`
    ).get(id);
}

function createAdmin(name, email, birthday, pfp) {
    const stmt = db.prepare(
        `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
        VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(name, email, bcrypt.hashSync(email, 10), 'admin', birthday, pfp);
}

function updateAdmin(id, name, email, birthday, pfp) {
    const stmt = db.prepare(
        `UPDATE user
        SET name = ?, email = ?, birthday = ?, pfp = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    );
    stmt.run(name, email, birthday, pfp, id);
}

function deleteAdmin(id) {
    const stmt = db.prepare(
        `DELETE FROM user WHERE id = ?`
    );
    stmt.run(id);
}

module.exports = {
    fetchAllAdmins,
    fetchAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin
};