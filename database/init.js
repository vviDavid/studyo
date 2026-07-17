const db = require('./config');

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pass TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('mentor', 'learner', 'admin')),
    birthday DATE,
    pfp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    reset_token TEXT
  );

  CREATE TABLE IF NOT EXISTS mentor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    expertise TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS learner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    course_desc TEXT,
    course_pfp TEXT,
    FOREIGN KEY (mentor_id) REFERENCES mentor(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS course_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK(content_type IN ('subject', 'task')),
    content_title TEXT NOT NULL,
    content_body TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS course_task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_content_id INTEGER NOT NULL,
    course_member_id INTEGER NOT NULL,
    task_submittance TEXT,
    task_status TEXT NOT NULL CHECK(task_status IN ('incomplete', 'submitted', 'graded')),
    task_score INTEGER,
    FOREIGN KEY (course_content_id) REFERENCES course_content(id) ON DELETE CASCADE,
    FOREIGN KEY (course_member_id) REFERENCES course_member(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS course_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    learner_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    FOREIGN KEY (learner_id) REFERENCES learner(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS course_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    course_member_id INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE,
    FOREIGN KEY (course_member_id) REFERENCES course_member(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    comment_body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE
  );
`);