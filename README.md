# STUDYO - Your Own Studio For Your Study

Selamat datang! Berikut adalah hal-hal yang perlu anda ketahui tentang `Studyo`.

## About the Creator

Studyo dirancang dan dibangun oleh **David Christian Siringoringo**, seorang mahasiswa jurusan Teknik Informatika Universitas IBBI sebagai pemenuhan *final project* pada mata kuliah *Web Programming II* di semester 4.

## About the Application

Aplikasi *Learning Management System* (LMS) ini bernama `Studyo`, memadukan istilah **Studio** dan **Study** yang berarti sebuah studio untuk melangsungkan aktivitas pembelajaran. Aplikasi ini akan menjadi salah satu alat yang memudahkan proses pembelajaran yang terjadi antara pengajar (dalam aplikasi disebut *Mentor*) dengan peserta ajar (dalam aplikasi disebut *Learner*). Pengguna yang memegang peran `mentor` dapat **menambahkan materi pada kelas yang ia pegang**, **memberikan tugas kepada learner**, **menilai hasil pekerjaan learner**, serta **membagi para learner dalam satu kelas menjadi sejumlah group kecil**. Sementara itu, pengguna yang berperan sebagai `learner` dapat **mengakses berbagai materi yang tersedia dalam kelas yang diikuti**, **mengumpulkan tugas yang diberikan oleh mentor**, dan **menerima nilai hasil pemeriksaan mentor terhadap pekerjaan yang dikumpulkan**. Para pengguna dalam satu kelas juga dapat **berkomunikasi** menggunakan fitur `comment`, baik bagi mentor maupun learner agar terjadi komunikasi dari berbagai arah dengan efektif.

## About the Database

Studyo menggunakan module `better-sqlite3` yang berjalan dengan perintah `SQLite` sebagai Database. Perancangan ERD (Entity Relationship Diagram) dilakukan menggunakan situs `dbdiagram.io` yang menghasilkan file dengan ekstensi `.dbml`. Struktur database dari ERD nantinya akan dikembangkan menjadi file database utuh dalam format `.db`.

### Tabel `user` (pengguna)

Menyimpan data setiap pengguna yang terdaftar di aplikasi.

>- **id** `PRIMARY KEY`
>- **name**
>- **email**
>- **pass**
>- **user_type**
>- **birthday**
>- **pfp**
>- **created_at**
>- **updated_at**

### Tabel `mentor` (pengajar)

Menyimpan data setiap pengguna yang terdaftar sebagai mentor. Terhubung dengan tabel [user](#tabel-user-pengguna) untuk mengambil id dari tabel pengguna.

>- **id** `PRIMARY KEY`
>- **user_id** `FOREIGN KEY dari user.id`
>- **expertise**

### Tabel `learner` (peserta ajar)

Menyimpan data setiap pengguna yang terdaftar sebagai learner. Terhubung dengan tabel [user](#tabel-user-pengguna) untuk mengambil id dari tabel pengguna.

>- **id** `PRIMARY KEY`
>- **user_id** `FOREIGN KEY dari user.id`
>- **grade**

### Tabel `course` (kelas/kursus)

Menyimpan data setiap kelas yang telah dibuat dalam aplikasi. Terhubung dengan tabel [mentor](#tabel-mentor-pengajar) untuk mengambil id mentor yang menjadi pengajar dalam kelas tersebut.

>- **id** `PRIMARY KEY`
>- **mentor_id** `FOREIGN KEY dari mentor.id`
>- **course_name**
>- **course_desc**
>- **course_pfp**

### Tabel `course_content` (materi kelas)

Menyimpan data setiap materi di dalam masing-masing kelas. Terhubung dengan tabel [course](#tabel-course-kelaskursus) untuk mengambil id kelas/kursus yang menampung materi tersebut.

>- **id** `PRIMARY KEY`
>- **course_id** `FOREIGN KEY dari course.id`
>- **content_type**
>- **content_title**
>- **content_body**

### Tabel `course_task` (tugas)

Menyimpan data tugas yang ada pada materi dalam kelas. Terhubung dengan tabel [course_content](#tabel-course_content-materi-kelas) untuk mengambil id materi kelas yang menjadi tempat pemberian tugas tersebut.

>- **id** `PRIMARY KEY`
>- **course_content_id** `FOREIGN KEY dari course_content.id`
>- **task_submittance**
>- **task_status**
>- **task_score**

### Tabel `course_member` (peserta kelas/kursus)

Menyimpan data setiap learner yang terdaftar dalam suatu kelas. Terhubung dengan tabel [learner](#tabel-learner-peserta-ajar) dan tabel [course](#tabel-course-kelaskursus) untuk mengambil id learner yang hendak didaftarkan serta id kelas/kursus yang hendak diikuti.

>- **id** `PRIMARY KEY`
>- **learner_id** `FOREIGN KEY dari learner.id`
>- **course_id** `FOREIGN KEY dari course.id`

### Tabel `course_group` (grup kelas/kursus)

Menyimpan data setiap group yang terbentuk dalam suatu kelas.

>- **id** `PRIMARY KEY`
>- **course_id** `FOREIGN KEY dari course.id`
>- **course_member_id** `FOREIGN KEY dari course_member.id`
>- **group_name**
>- **group_desc**

### Tabel `comment` (komentar)

Menyimpan setiap komentar yang disampaikan oleh semua pengguna di dalam kelas.

>- **id** `PRIMARY KEY`
>- **user_id** `FOREIGN KEY dari user.id`
>- **course_id** `FOREIGN KEY dari course.id`
>- **comment_body**

Untuk melihat sintaks asli dalam format `.dbml` dan keterangan lengkap untuk semua tabel, lihat pada [studyo_erd.dbml](./studyo_erd.dbml). Struktur ERD dalam format gambar juga tersimpan dalam folder **images** ([studyo_erd](./images/studyo_erd.png))

![studyo_erd](./images/studyo_erd.png)

Struktur database ini masih bersifat sementara, perubahan akan terus terjadi seiring pengembangan aplikasi untuk melengkapi atau menyingkirkan komponen-komponen yang terdapat dalam database ini.