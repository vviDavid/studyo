const fs = require('fs');
const path = require('path');

const db = require('../database/config');

function deleteUploadedImage(fileName) {
    if (!fileName) return;

    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
    if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
    }
}

function fetchCurrentUserProfile(userId) {
    return db.prepare(
        `SELECT user.id, user.name, user.email, user.user_type, user.birthday, user.pfp,
        mentor.expertise, learner.grade
        FROM user
        LEFT JOIN mentor ON mentor.user_id = user.id
        LEFT JOIN learner ON learner.user_id = user.id
        WHERE user.id = ?`
    ).get(userId);
}

function validateProfile(name, email, birthday, userType, expertise, grade) {
    const errorMessage = [];

    if (!name || name.trim() === '') {
        errorMessage.push('Name is required.');
    } else if (name.trim().length < 3) {
        errorMessage.push('Name must be at least 3 characters long.');
    }

    if (!email || email.trim() === '') {
        errorMessage.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errorMessage.push('Email format is invalid.');
    }

    if (birthday && Number.isNaN(Date.parse(birthday))) {
        errorMessage.push('Birthday must be a valid date.');
    } else if (birthday && new Date(birthday) > new Date()) {
        errorMessage.push('Birthday cannot be in the future.');
    }

    if (userType === 'mentor' && expertise && expertise.trim().length > 120) {
        errorMessage.push('Expertise must be at most 120 characters.');
    }

    if (userType === 'learner' && grade && grade.trim().length > 30) {
        errorMessage.push('Grade must be at most 30 characters.');
    }

    return errorMessage;
}

function showProfileBio(req, res) {
    const profile = fetchCurrentUserProfile(req.session.user_id);

    if (!profile) {
        return res.status(404).render('pages/error', {
            title: 'Profile Not Found',
            message: "We couldn't find your profile."
        });
    }

    res.render('pages/profile/bio', {
        title: `${profile.name} - Profile`,
        profile,
        successMessage: req.query.success
    });
}

function showEditProfile(req, res) {
    const profile = fetchCurrentUserProfile(req.session.user_id);

    if (!profile) {
        return res.status(404).render('pages/error', {
            title: 'Profile Not Found',
            message: "We couldn't find your profile."
        });
    }

    res.render('pages/profile/edit', {
        title: 'Edit Profile - Studyo',
        profile
    });
}

function runEditProfile(req, res) {
    const userId = req.session.user_id;
    const uploadedFile = req.file;
    const { name, email, birthday, expertise, grade, removePhoto } = req.body;

    const currentProfile = fetchCurrentUserProfile(userId);

    if (!currentProfile) {
        if (uploadedFile) deleteUploadedImage(uploadedFile.filename);
        return res.status(404).render('pages/error', {
            title: 'Profile Not Found',
            message: "We couldn't find your profile."
        });
    }

    const errorMessage = validateProfile(
        name,
        email,
        birthday,
        currentProfile.user_type,
        expertise,
        grade
    );

    const existingEmailOwner = db.prepare(
        `SELECT id FROM user WHERE email = ? AND id != ?`
    ).get((email || '').trim(), userId);

    if (existingEmailOwner) {
        errorMessage.push('Email is already used by another account.');
    }

    if (errorMessage.length > 0) {
        if (uploadedFile) deleteUploadedImage(uploadedFile.filename);

        return res.render('pages/profile/edit', {
            title: 'Edit Profile - Studyo',
            errorMessage,
            profile: {
                ...currentProfile,
                name,
                email,
                birthday,
                expertise: currentProfile.user_type === 'mentor' ? expertise : currentProfile.expertise,
                grade: currentProfile.user_type === 'learner' ? grade : currentProfile.grade
            }
        });
    }

    let pfp = currentProfile.pfp || null;

    if (removePhoto === '1') {
        deleteUploadedImage(pfp);
        pfp = null;
    } else if (uploadedFile) {
        if (pfp) {
            deleteUploadedImage(pfp);
        }
        pfp = uploadedFile.filename;
    }

    try {
        db.prepare(
            `UPDATE user
            SET name = ?, email = ?, birthday = ?, pfp = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`
        ).run((name || '').trim(), (email || '').trim(), birthday || null, pfp, userId);

        if (currentProfile.user_type === 'mentor') {
            db.prepare(
                `UPDATE mentor
                SET expertise = ?
                WHERE user_id = ?`
            ).run((expertise || '').trim() || null, userId);
        }

        if (currentProfile.user_type === 'learner') {
            db.prepare(
                `UPDATE learner
                SET grade = ?
                WHERE user_id = ?`
            ).run((grade || '').trim() || null, userId);
        }

        req.session.name = (name || '').trim();
        req.session.email = (email || '').trim();
        req.session.pfp = pfp;

        res.redirect('/profile?success=Profile+updated+successfully.');
    } catch (error) {
        console.error('Error updating profile:', error);

        if (uploadedFile) {
            deleteUploadedImage(uploadedFile.filename);
        }

        res.render('pages/profile/edit', {
            title: 'Edit Profile - Studyo',
            profile: {
                ...currentProfile,
                name,
                email,
                birthday,
                expertise: currentProfile.user_type === 'mentor' ? expertise : currentProfile.expertise,
                grade: currentProfile.user_type === 'learner' ? grade : currentProfile.grade,
                pfp
            },
            errorMessage: ['Failed to update profile. Please try again.']
        });
    }
}

module.exports = {
    showProfileBio,
    showEditProfile,
    runEditProfile
};