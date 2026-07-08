const Database = require('better-sqlite3');
const db = new Database('studyo-lms.db');

module.exports = db;