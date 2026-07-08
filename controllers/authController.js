const db = require("../database/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { transporter } = require('../config/mail');

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function showLoginPage(req, res) {
    res.render("pages/auth/login", {
        title: "Welcome!",
        layout: 'auth'
    });
}

function showForgetPassPage(req, res) {
    res.render("pages/auth/forget-pass", {
        title: "Forget Password",
        layout: 'auth'
    });
}

function showResetPassPage(req, res) {
    const { token } = req.query;

    res.render("pages/auth/reset-pass", {
        title: "Password Reset",
        layout: 'auth',
        token
    });
}

function handleLogin(req, res) {
    const { email, pass } = req.body;

    if (!email || !pass) {
        return res.render("pages/auth/login", {
            title: "Welcome!",
            layout: 'auth',
            errorMessage: ["Email and password is required!"]
        });
    }

    const user = db.prepare(
        `SELECT id, name, email, pass, user_type, pfp
        FROM user
        WHERE email = ?`
    ).get(email);

    if (!user) {
        return res.render("pages/auth/login", {
            title: "Welcome!",
            layout: 'auth',
            errorMessage: ["Email is not registered!"]
        });
    }

    if (!bcrypt.compareSync(pass, user.pass)) {
        return res.render("pages/auth/login", {
            title: "Welcome!",
            layout: 'auth',
            errorMessage: ["Incorrect password!"]
        });
    }

    req.session.user_id = user.id;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.user_type = user.user_type;
    req.session.pfp = user.pfp;

    res.redirect("/");
}

function handleLogout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error occured when trying to log out: ", err);
        }

        res.redirect("/");
    });
}

function handleForgetPass(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.render("pages/auth/forget-pass", {
            title: "Forget Password",
            layout: 'auth',
            errorMessage: ["Email is required!"]
        });
    }

    const user = db.prepare(
        `SELECT id, name, email
        FROM user
        WHERE email = ?`
    ).get(email);

    if (!user) {
        return res.render("pages/auth/forget-pass", {
            title: "Forget Password",
            layout: 'auth',
            errorMessage: ["Email is not registered!"]
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    db.prepare(
        `UPDATE user
        SET reset_token = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).run(resetToken, user.id);

    sendPassResetEmail(user.name, user.email, resetToken)
        .then(() => {
            res.render("pages/auth/forget-pass", {
                title: "Forget Password",
                layout: 'auth',
                successMessage: ["Your link for password reset has been sent to your email!"]
            });
        })
        .catch((error) => {
            console.error("Error occured when trying to send password reset email: ", error);
            res.render("pages/auth/forget-pass", {
                title: "Forget Password",
                layout: 'auth',
                errorMessage: ["Failed to send your password reset email"]
            });
        });
}

async function sendPassResetEmail(name, email, resetToken) {
    const resetUrl = `${APP_URL}/auth/reset-pass?token=${resetToken}`;

    const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f4f7fb; padding: 40px 20px;">
        <!-- Container -->
        <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Studyo</h1>
                <p style="color: rgba(255, 255, 255, 0.85); margin: 8px 0 0 0; font-size: 14px;">You requested a password reset</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #0f172a; margin: 0 0 24px 0; font-weight: 600;">Greetings, <strong>${name}</strong>,</p>
                
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 32px 0;">We are sorry that you forget your password, but worry not, you may reset it here:</p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 0 0 32px 0;">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; display: inline-block; transition: transform 0.2s ease; font-size: 15px;">Reset your password now</a>
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
        subject: `Reset Password - ${name}`,
        html: html
    });
}

function handleResetPass(req, res) {
    const { token, pass } = req.body;

    if (!token || !pass) {
        return res.render("pages/auth/reset-pass", {
            title: "Password Reset",
            layout: 'auth',
            token,
            errorMessage: ["Token and password is required!"]
        });
    }

    const user = db.prepare(
        `SELECT id
        FROM user
        WHERE reset_token = ?`
    ).get(token);

    if (!user) {
        return res.render("pages/auth/reset-pass", {
            title: "Forget Password",
            layout: 'auth',
            token,
            errorMessage: ["Your token is not valid!"]
        });
    }

    const encryptedPass = bcrypt.hashSync(pass, 10);

    db.prepare(
        `UPDATE user
        SET pass = ?, reset_token = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).run(encryptedPass, user.id);

    res.render("pages/auth/login", {
        title: "Welcome!",
        layout: 'auth',
        successMessage: ["Password has been reset. You may login with your new password."]
    });
}

module.exports = {
    showLoginPage,
    showForgetPassPage,
    showResetPassPage,
    handleLogin,
    handleLogout,
    handleForgetPass,
    handleResetPass
}