const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require('../models/user')(sequelize, Sequelize.DataTypes);
const joi = require('joi');
const jose = require('jose');
const crypto = require("crypto");
const util = require("util");
const sharp = require("sharp");
const path = require("path");
const config = require("../config");
const nodemailer = require("nodemailer");
const scrypt = util.promisify(crypto.scrypt);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.SEND_EMAIL,
      pass: config.PASS_EMAIL
    }
});

exports.allUsers = async (req, res) => {
    try {
        const result = await User.findAll();
        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

exports.infoUser = async (req, res) => {
    try {
        let user_id = 0;
        if (req.params.user_id != 0) {
            user_id = req.params.user_id;
        } else {
            user_id = req.id;
        }

        const result = await User.findByPk(user_id);
        if (!result) {
            return res.status(400).json({ error: "User with this ID does not exist" });
        }

        res.status(200).json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
};

const create_user_schema = joi.object({
    login: joi.string().required().min(3).max(32).pattern(/^[A-z0-9_]+$/).message({
        "any.required": "Login is required",
        "string.min": "The login must contain at least 3 characters",
        "string.max": "The maximum login length is 32 characters",
        "string.pattern.base": "Login should contain only latin letters, numbers and _"
    }),
    password: joi.string().required().min(8).max(64).pattern(/^(?=.*[A-Z])[A-z0-9]+$/).message({
        "any.required": "Password is required",
        "string.min": "The password must contain at least 8 characters",
        "string.max": "The maximum password length is 64 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and symbols"
    }),
    password_confirmation: joi.string().required().valid(joi.ref("password")).messages({
        "any.required": "Password confirmation is required",
        "any.only": "Password confirmation does not match password"
    }),
    email: joi.string().required().email().message({
        "any.required": "Email is required",
        "string.email": "Email is not valid"
    }),
    role: joi.string().required().valid("user", "admin").messages({
        "any.required": "Role is required",
        "any.only": "Role must be user or admin"
    })
});

exports.create_user = async (req, res) => {
    const { error, value } = create_user_schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    try {
        const salt = crypto.randomBytes(16).toString("hex");
        const password_hash = await scrypt(value.password, salt, config.KEYLEN_PASS);
        const password = salt+":"+password_hash.toString("hex");
        newDataUser = {
            login: value.login,
            password: password,
            email: value.email,
            verification_email: true,
            role: value.role
        }
        
        const checkUnique = await User.findOne({ where: { [Sequelize.Op.or]: [{ email: newDataUser.email}, { login: newDataUser.login }] } });
        
        if (checkUnique) {
            return res.status(400).json({ error: "Login and/or Email must be unique" });
        }

        await User.create(newDataUser);
        res.status(201).json({ message: "Success register"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.editAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Avatar is required" });
        }
        let user_id = 0;
        if (req.params.user_id != 0) {
            user_id = req.params.user_id;
            const check = await User.findByPk(user_id);
            if (!check) {
                return res.status(400).json({ error: "User not found" });
            }
            const checkRole = await User.findByPk(req.id);
            if (checkRole.role !== "admin") {
                return res.status(403).json( { error: "You do not have rights to this resource"});
            }
        } else {
            user_id = req.id
        }

        const dest_file = path.join(__dirname, "..", "uploads", "avatars", req.id + ".png");
        await sharp(req.file.buffer).resize(200, 200).toFormat("png").toFile(dest_file);

        const result = await User.findByPk(user_id);
        result.profile_picture = "http://localhost:" + 5868 + "/uploads/avatars/" + user_id + ".png";
        await result.save({ fields: ["profile_picture"] });

        res.status(200).json({ message: "Avatar uploaded"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editUserOwnSchema = joi.object({
    password: joi.string().min(8).max(64).pattern(/^(?=.*[A-Z])[A-z0-9]+$/).message({
        "string.min": "The password must contain at least 8 characters",
        "string.max": "The maximum password length is 64 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and symbols"
    }),
    password_confirmation: joi.string().valid(joi.ref("password")).messages({
        "any.only": "Password confirmation does not match password"
    }),
    full_name: joi.string().pattern(/^[A-Za-z]+\s+[A-Za-z]+$/).message({
        "string.pattern.base": "The full name must contain only Latin letters and consist of two words"
    }),
    email: joi.string().email().message({
        "string.email": "Email is not valid"
    })
});

exports.editProfileOwn = async (req, res) => {

    const { error, value } = editUserOwnSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    try {
        const result = await User.findByPk(req.id);

        if (value.password) {
            if (value.password !== value.password_confirmation) {
                return res.status(400).json({ error: "Password confirmation does not match password" })
            }
            const salt = crypto.randomBytes(16).toString("hex");
            const password_hash = await scrypt(value.password, salt, config.KEYLEN_PASS);
            const password = salt+":"+password_hash.toString("hex");
            result.password = password
        }

        result.full_name = value.full_name || result.full_name;

        if (value.email) {

            if (result.email === value.email) {
                return res.status(400).json({ error: "Email should be different from the old one" })
            }

            const check_email = await User.findOne({ where: { email: value.email }});
            if (check_email) {
                return res.status(403).json({ error: "Email must be unique" });
            }
            result.email = value.email;
            result.verification_email = false;

            const secretKey = new TextEncoder().encode(config.SECRET_KEY);
            const jwt = await new jose.SignJWT({id: result.id}).setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(secretKey);

            await transporter.sendMail({
                from: config.SEND_EMAIL,
                to: result.email,
                subject: "Verify Your Email ProjectN",
                text: "To verify your email, please follow this link " + "http://localhost:" + config.PORT + "/register/" + jwt
            });
        }
        await result.save();
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editUserSchema = joi.object({
    login: joi.string().min(3).max(32).pattern(/^[A-z0-9_]+$/).message({
        "string.min": "The login must contain at least 3 characters",
        "string.max": "The maximum login length is 32 characters",
        "string.pattern.base": "Login should contain only latin letters, numbers and _"
    }),
    password: joi.string().min(8).max(64).pattern(/^(?=.*[A-Z])[A-z0-9]+$/).message({
        "string.min": "The password must contain at least 8 characters",
        "string.max": "The maximum password length is 64 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and symbols"
    }),
    full_name: joi.string().pattern(/^[A-Za-z]+\s+[A-Za-z]+$/).message({
        "string.pattern.base": "The full name must contain only Latin letters and consist of two words"
    }),
    email: joi.string().email().message({
        "string.email": "Email is not valid"
    }),
    rating: joi.number().messages({
        "number.base": "Rating must be number"
    }),
    role: joi.string().valid("user", "admin").messages({
        "any.only": "Role must be user or admin"
    })
});

exports.editProfile = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = editUserSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    try {
        const result = await User.findByPk(req.id);

        if (value.login) {
            const check_login = await User.findOne({ where: { login: value.login }});
            if (check_login) {
                return res.status(403).json({ error: "Login must be unique" });
            }
            result.login = value.login;
        }

        if (value.password) {
            const salt = crypto.randomBytes(16).toString("hex");
            const password_hash = await scrypt(value.password, salt, config.KEYLEN_PASS);
            const password = salt+":"+password_hash.toString("hex");
            result.password = password;
        }
        result.full_name = value.full_name || result.full_name;

        if (value.email) {
            const check_email = await User.findOne({ where: { email: value.email }});
            if (check_email) {
                return res.status(403).json({ error: "Email must be unique" });
            }
            result.email = value.email;
        }

        result.rating = value.rating || result.rating;
        result.role = value.role || result.role;
        await result.save();
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const result = await User.findByPk(req.params.user_id);
        await result.destroy();

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};