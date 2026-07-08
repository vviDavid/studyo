const fs = require('fs');
const path = require('path');

const AdminModel = require('../models/Admin');

const { transporter } = require("../config/mail");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function deleteUploadedImage(fileName) {
    if (!fileName) return;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
    if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
    }
}

function validateAdmin(name, email, birthday) {
    const errorMessage = [];

    if (!name || name.trim() === "") {
        errorMessage.push("Name is required!");
    } else if (name.trim().length < 3) {
        errorMessage.push("Name must be at least 3 characters long!");
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
        errorMessage.push("Name must contain only alphabets and spaces!");
    }

    if (!email || email.trim() === "") {
        errorMessage.push("Email is required!");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errorMessage.push("Email must follow the correct format!");
    }

    if (birthday && isNaN(Date.parse(birthday))) {
        errorMessage.push("Birthday must be a valid date!");
    } else if (birthday && new Date(birthday) > new Date()) {
        errorMessage.push("Birthday cannot be in the future!");
    }

    return errorMessage;
}

function showCreateAdmin(req, res) {
    res.render("pages/admin/create", {
        title: "Create Admin - Studyo"
    });
}

function showAdminList(req, res) {
    const admin = AdminModel.fetchAllAdmins();

    res.render("pages/admin/list", {
        title: "List of Admins - Studyo",
        admin
    });
}

function showEditAdmin(req, res) {
    const { id } = req.params;

    const admin = AdminModel.fetchAdminById(id);

    res.render("pages/admin/edit", {
        title: "Update Admin - Studyo",
        admin
    })
}

function runCreateAdmin(req, res) {
    const { name, email, birthday, removePhoto } = req.body;
    const uploadedFile = req.file;

    const errorMessage = validateAdmin(name, email, birthday);

    if (errorMessage.length > 0) {
        res.render("pages/admin/create", {
            title: "Create Admin - Studyo",
            errorMessage,
            existingData: { name, email, birthday }
        });
        return;
    }

    const pfp = removePhoto === '1' ? null : uploadedFile ? uploadedFile.filename : null;

    AdminModel.createAdmin(name, email, birthday, pfp);

    sendConfirmationEmail(name, email);

    res.redirect("/admin/list");
}

async function sendConfirmationEmail(name, email) {
    const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f4f7fb; padding: 40px 20px;">
        <!-- Container -->
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Studyo</h1>
                <p style="color: rgba(255, 255, 255, 0.85); margin: 8px 0 0 0; font-size: 14px;">Welcome to Studyo! We are happy to see you here ^^</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #0f172a; margin: 0 0 24px 0; font-weight: 600;">Greetings, <strong>${name}</strong>,</p>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 32px 0;">Your account as an admin has been made successfully, you may start here:</p>

                <!-- Credentials Card -->
                <div style="background: #f8faff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
                    <div style="margin-bottom: 16px;">
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">Email</p>
                        <p style="font-size: 15px; color: #4f46e5; margin: 0; font-family: 'Monaco', 'Menlo', monospace; word-break: break-all;">${email}</p>
                    </div>
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                        <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;">Password</p>
                        <p style="font-size: 15px; color: #0f172a; margin: 0; font-family: 'Monaco', 'Menlo', monospace; word-break: break-all;">Same as your Email.</p>
                    </div>
                </div>

                <!-- Warning -->
                <div style="background: rgba(79, 70, 229, 0.08); border-left: 3px solid #4f46e5; border-radius: 6px; padding: 16px; margin: 0 0 32px 0;">
                    <p style="font-size: 13px; color: #3730a3; margin: 0; line-height: 1.5;">
                        <strong>⚠️ Warning:</strong> Change your password immediately for your account security.
                    </p>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 0 0 32px 0;">
                    <a href="${APP_URL}/auth/login" style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; display: inline-block; transition: transform 0.2s ease; font-size: 15px;">Login to your account now</a>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                    Ignore this mail if this is not you. Contact us for more informations on Studyo.
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8faff; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center;">
                <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">© 2026 Studyo. Your Studio for Studying.</p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">This Email is sent automatically. Do not reply.</p>
            </div>
        </div>
    </div>
    `;

    await transporter.sendMail({
        from: {
            name: "Buddy-o",
            address: "buddyo@studyo.com"
        },
        to: email,
        subject: `Account Confirmation - ${name}`,
        html: html
    });
}

function runEditAdmin(req, res) {
    const { id } = req.params;
    const { name, email, birthday, removePhoto } = req.body;
    const uploadedFile = req.file;

    const errorMessage = validateAdmin(name, email, birthday);

    if (errorMessage.length > 0) {
        const admin = AdminModel.fetchAdminById(id);
        res.render("pages/admin/edit", {
            title: "Update Admin - Studyo",
            errorMessage,
            existingData: { name, email, birthday },
            id,
            admin
        });
        return;
    }

    const currentAdmin = AdminModel.fetchAdminById(id);
    let pfp = currentAdmin?.pfp || null;

    if (removePhoto === '1') {
        deleteUploadedImage(pfp);
        pfp = null;
    } else if (uploadedFile) {
        if (pfp) {
            deleteUploadedImage(pfp);
        }
        pfp = uploadedFile.filename;
    }

    AdminModel.updateAdmin(id, name, email, birthday, pfp);

    res.redirect("/admin/list");
}

function runDeleteAdmin(req, res) {
    const { id } = req.params;

    AdminModel.deleteAdmin(id);

    res.redirect("/admin/list");
}

module.exports = {
    showCreateAdmin,
    showAdminList,
    showEditAdmin,
    runCreateAdmin,
    runEditAdmin,
    runDeleteAdmin
}