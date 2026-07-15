const db = require('./config');
const bcrypt = require('bcrypt');

const mentorFirstNames = [
  'Ahmad', 'Budi', 'Citra', 'Deni', 'Eka',
  'Fitra', 'Gita', 'Hendra', 'Indah', 'Joko'
];

const mentorLastNames = [
  'Hermawan', 'Wijaya', 'Pratama', 'Kusuma', 'Rahman',
  'Saputra', 'Sutrisno', 'Nugroho', 'Santoso', 'Rusmanto'
];

const mentorExpertise = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'Literature',
  'Economics'
];

const learnerFirstNames = [
  'Rina', 'Siti', 'Tina', 'Ulfah', 'Vina',
  'Wina', 'Xenia', 'Yanti', 'Zara', 'Alma'
];

const learnerLastNames = [
  'Andrian', 'Budiman', 'Cahyono', 'Darmo', 'Effendi',
  'Firmansyah', 'Gunarso', 'Hartono', 'Irawan', 'Jatmiko'
];

const adminNames = [
  'Super Admin',
  'Admin Akademik',
  'Admin Sistem',
  'Admin Pembelajaran',
  'Admin Data',
  'Admin Keamanan',
  'Admin Teknis',
  'Admin Operasional',
  'Admin Monitoring',
  'Admin Support'
];

const courseNames = [
  'Dasar-Dasar Matematika',
  'Fisika Modern',
  'Kimia Organik',
  'Bahasa Inggris Lanjut',
  'Biologi Sel',
  'Sejarah Indonesia',
  'Geografi Fisik',
  'Pemrograman Web',
  'Sastra Dunia',
  'Ekonomi Makro'
];

const courseDescriptions = [
  'Pelajari konsep dasar matematika yang fundamental untuk ilmu pengetahuan',
  'Memahami prinsip-prinsip fisika dalam dunia modern',
  'Eksplorasi mendalam tentang struktur dan reaksi senyawa organik',
  'Tingkatkan kemampuan berbahasa Inggris untuk komunikasi profesional',
  'Pelajari cara kerja dan struktur sel hidup',
  'Mendalami sejarah perkembangan bangsa Indonesia',
  'Memahami fenomena geografis dan alam dunia',
  'Belajar membuat website modern dan responsif',
  'Menganalisis karya-karya sastra terbesar dunia',
  'Memahami sistem ekonomi dan kebijakan makroekonomi'
];

const grades = ['X', 'XI', 'XII', 'X-A', 'X-B', 'XI-A', 'XI-B', 'XII-A', 'XII-B', 'XII-C'];

function generateRandomDate(startYear = 1980, endYear = 2010) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function seedAdmins() {
  console.log('Seeding admins...');
  const adminStmt = db.prepare(
    `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (let i = 0; i < 10; i++) {
    const email = `admin${i + 1}@studyo.com`;
    adminStmt.run(
      adminNames[i],
      email,
      bcrypt.hashSync(email, 10),
      'admin',
      generateRandomDate(1970, 1990),
      null
    );
  }
  console.log('✓ 10 admins created');
}

function seedMentors() {
  console.log('Seeding mentors...');
  const userStmt = db.prepare(
    `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const mentorStmt = db.prepare(
    `INSERT INTO mentor (user_id, expertise)
     VALUES (?, ?)`
  );

  for (let i = 0; i < 10; i++) {
    const name = `${mentorFirstNames[i]} ${mentorLastNames[i]}`;
    const email = `mentor${i + 1}@studyo.com`;
    
    const userResult = userStmt.run(
      name,
      email,
      bcrypt.hashSync(email, 10),
      'mentor',
      generateRandomDate(1970, 1995),
      null
    );

    mentorStmt.run(userResult.lastInsertRowid, mentorExpertise[i]);
  }
  console.log('✓ 10 mentors created');
}

function seedLearners() {
  console.log('Seeding learners...');
  const userStmt = db.prepare(
    `INSERT INTO user (name, email, pass, user_type, birthday, pfp)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const learnerStmt = db.prepare(
    `INSERT INTO learner (user_id, grade)
     VALUES (?, ?)`
  );

  for (let i = 0; i < 10; i++) {
    const name = `${learnerFirstNames[i]} ${learnerLastNames[i]}`;
    const email = `learner${i + 1}@studyo.com`;
    
    const userResult = userStmt.run(
      name,
      email,
      bcrypt.hashSync(email, 10),
      'learner',
      generateRandomDate(2005, 2010),
      null
    );

    learnerStmt.run(userResult.lastInsertRowid, grades[i]);
  }
  console.log('✓ 10 learners created');
}

function seedCourses() {
  console.log('Seeding courses...');
  const courseStmt = db.prepare(
    `INSERT INTO course (mentor_id, course_name, course_desc, course_pfp)
     VALUES (?, ?, ?, ?)`
  );

  // Get all mentors
  const mentors = db.prepare('SELECT id FROM mentor').all();

  for (let i = 0; i < 10; i++) {
    const mentorId = mentors[i % mentors.length].id;
    courseStmt.run(
      mentorId,
      courseNames[i],
      courseDescriptions[i],
      null
    );
  }
  console.log('✓ 10 courses created');
}

function runSeeder() {
  try {
    console.log('\n=== Starting Database Seeding ===\n');

    // Clear existing data in reverse order of dependencies
    console.log('Clearing existing data...');
    db.exec(`
      DELETE FROM comment;
      DELETE FROM course_task;
      DELETE FROM course_member;
      DELETE FROM course_content;
      DELETE FROM course;
      DELETE FROM learner;
      DELETE FROM mentor;
      DELETE FROM user;
    `);
    console.log('✓ Database cleared\n');

    // Seed data in order of dependencies
    seedAdmins();
    seedMentors();
    seedLearners();
    seedCourses();

    console.log('\n=== Database Seeding Completed Successfully ===\n');
    console.log('Summary:');
    console.log('- 10 Admin users');
    console.log('- 10 Mentors (linked to users)');
    console.log('- 10 Learners (linked to users)');
    console.log('- 10 Courses (each mentor has 1 course)');
    console.log('\nAll relationships and foreign keys are properly maintained.\n');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

module.exports = { runSeeder };