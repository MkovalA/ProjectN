const sequelize = require("../db");
const Sequelize = require("sequelize");
const joi = require('joi');
const jose = require('jose');
const User = require('../models/user')(sequelize, Sequelize.DataTypes);
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const util = require("util");
const Redis = require("ioredis");
const redisMock = new Redis();
const config = require("../config");
const scrypt = util.promisify(crypto.scrypt);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.SEND_EMAIL,
      pass: config.PASS_EMAIL
    }
});

async function generate_jwt(inputId, expirationTime, secret) {
    try {
        const secretKey = new TextEncoder().encode(secret);
        return await new jose.SignJWT({id: inputId}).setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secretKey);
    } catch (err) {
        throw err; 
    }
}

const reg_schema = joi.object({
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
    full_name: joi.string().required().pattern(/^[A-Za-z]+\s+[A-Za-z]+$/).message({
        "any.required": "Full name is required",
        "string.pattern.base": "The full name must contain only Latin letters and consist of two words"
    }),
    email: joi.string().required().email().message({
        "any.required": "Email is required",
        "string.email": "Email is not valid"
    })
});

exports.register = async (req, res) => {
    const { error, value } = reg_schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = await scrypt(value.password, salt, config.KEYLEN_PASS);
    const password = salt+":"+password_hash.toString("hex");
    newDataUser = {
        login: value.login,
        password: password,
        full_name: value.full_name,
        email: value.email
    }
    
    try {
        const check_unique = await User.findOne( { where: { [Sequelize.Op.or]: [{ email: newDataUser.email}, { login: newDataUser.login }] } });
        if (check_unique) {
            return res.status(400).json({ error: "Login and/or Email must be unique" });
        }

        await User.create(newDataUser);
        const result = await User.findOne( { where: { email: newDataUser.email } });

        const jwt = await generate_jwt(result.id, "1h", config.SECRET_KEY);
        const hashId = crypto.createHash('sha256').update(result.id + config.SALT).digest('hex');

        const expire_time = 60 * 60;
        await redisMock.set(hashId, jwt, "EX", expire_time);

        await transporter.sendMail({
            from: config.SEND_EMAIL,
            to: result.email,
            subject: "Verify Your Email ProjectN",
            text: "To verify your email, please follow this link " + "http://localhost:" + config.PORT + "/register/" + jwt
        });

        res.status(201).json({ message: "Success register"});
    }  catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const jwt = req.params.confirm_token;
        const secretKey = new TextEncoder().encode(config.SECRET_KEY);
        const { payload } = await jose.jwtVerify(jwt, secretKey);
        const hashId = crypto.createHash("sha256").update(payload.id + config.SALT).digest('hex');
        if (!await redisMock.exists(hashId)) {
            return res.status(400).json({ error: "Invalid token" });
        }
        const result = await User.findByPk(payload.id);
        result.verification_email = true;
        await result.save({ fields: ["verification_email"] });
        res.status(200).json({ message: "Email verified" });
    } catch (err) {
        if (err.code === "ERR_JWT_EXPIRED") {
            res.status(401).json({ error: "Token has expired"});
        } else {
            res.status(400).json({ error: err.message });
        }
    }
}

const login_schema = joi.object({
    login: joi.string().required().min(3).max(32).pattern(/^[a-zA-Z0-9_]+$/).message({
        "any.required": "Login is required",
        "string.min": "The login must contain at least 3 characters",
        "string.max": "The maximum login length is 32 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and _"
    }),
    email: joi.string().required().email().message({
        "any.required": "Email is required",
        "string.email": "Email is not valid"
    }),
    password: joi.string().required().min(8).max(64).pattern(/^[A-Za-z0-9\W]+$/).message({
        "any.required": "Password is required",
        "string.min": "The password must contain at least 8 characters",
        "string.max": "The maximum password length is 64 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and symbols"
    })
});

exports.login = async (req, res) => {
    const { error, value } = login_schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    newDataUser = {
        login: value.login,
        password: value.password,
        email: value.email
    }

    try {
        const result = await User.findOne({ where: { login: newDataUser.login} });
        if (!result) {
            return res.status(401).json({ error: "Login and/or password are incorrect" });
        }
        const [saltPassword, LoginPasswordHash] = result.password.split(':');
        const InputPasswordHash = await scrypt(newDataUser.password, saltPassword, config.KEYLEN_PASS);
        if (InputPasswordHash.toString("hex") !== LoginPasswordHash) {
            return res.status(401).json({ error: "Login and/or password are incorrect" });
        }

        if (result.verification_email == true) {
            
            const refresh_expire = 60 * 60 * 24 * 30;

            const access_token = await generate_jwt(result.id, "15m", config.SECRET_KEY);
            const refresh_token = await generate_jwt(result.id, "30d", config.SECRET_KEY_REFRESH);
            await redisMock.set(refresh_token, "true", "EX", refresh_expire);

            res.status(200).json({ access_token: access_token, refresh_token: refresh_token });
        } else {
            res.status(403).json({ error: "Email not verified" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const resendVerifyLinkSchema = joi.object({
    email: joi.string().required().email().message({
        "any.required": "Email is required",
        "string.email": "Email is not valid"
    })
});

exports.resendVerifyLink = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "no data"});
    }

    const { error, value } = resendVerifyLinkSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await User.findOne({ where: { email: value.email} });
        if (!result) {
            return res.status(401).json({ error: "User not found" });
        }

        await RedisMock.del(result.id);

        if (result.verification_email != true) {
            const jwt = await generate_jwt(result.id, "1h", config.SECRET_KEY);
            const hashId = crypto.createHash('sha256').update(result.id + config.SALT).digest('hex');

            const expire_time = 60 * 60;
            await redisMock.set(hashId, jwt, "EX", expire_time);

            await transporter.sendMail({
                from: config.SEND_EMAIL,
                to: result.email,
                subject: "Verify Your Email ProjectN",
                text: "To verify your email, please follow this link " + "http://localhost:" + config.PORT + "/register/" + jwt
            });

            res.status(201).json({ message: "Success resend"});
        } else {
            res.status(403).json({ error: "Email verified" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logout = async (req, res) => {
    const auth = req.headers["authorization"];
    console.log(auth);
    if (!auth) {
        return res.status(400).json({ error: "Token is missing" });
    }
    const token = auth.split(" ")[1];
    try {
        if (!await redisMock.exists(token)) {
            return res.status(400).json({ error: "Token invalid" });
        }

        await redisMock.del(token);
        res.status(200).json({ message: "Success logout" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.refresh_token = async (req, res) => {
    try {
    const auth = req.headers["authorization"];
    const token = auth.split(" ")[1];
    if (!token) {
        return res.status(400).json({ error: "The required token" });
    }

    if (!await redisMock.exists(token)) {
        return res.status(400).json({ error: "Invalid token" });
    }
    const secretKey = new TextEncoder().encode(config.SECRET_KEY_REFRESH);
    const { payload } = await jose.jwtVerify(token, secretKey);

    const access_token = await generate_jwt(payload.id, "15m", config.SECRET_KEY);
    res.status(200).json({ access_token: access_token });
    } catch (err) {
        if (err.code === "ERR_JWT_EXPIRED") {
            res.status(401).json({ error: "Token has expired"});
        } else {
            res.status(400).json({ error: err.message });
        }
    }
};

const password_reset_schema = joi.object({
    email: joi.string().required().email().message({
        "any.required": "Email is required",
        "string.email": "Email is not valid"
    })
});

exports.password_reset = async (req, res) => {
    const { error, value } = password_reset_schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await User.findOne( { where: { email: value.email} } );
        if (result) {
            const jwt = await generate_jwt(result.id, "1h", config.SECRET_KEY);

            await transporter.sendMail({
                from: config.SEND_EMAIL,
                to: value.email,
                subject: "Reset password ProjectN",
                text: "Reset password " + "http://localhost:" + config.PORT + "/password-reset/" + jwt
            });

            res.status(200).json({ message: "Reset link has been sent to your email" });
        } else {
            res.status(401).json({ message: "Account with this address does not exist" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const password_reset_token_schema = joi.object({
    new_password: joi.string().required().min(8).max(64).pattern(/^[A-Za-z0-9\W]+$/).message({
        "any.required": "Password is required",
        "string.min": "The password must contain at least 8 characters",
        "string.max": "The maximum password length is 64 characters",
        "string.pattern.base": "Passwords should contain only latin letters, numbers and symbols"
    })
});

exports.password_reset_token = async (req, res) => {
    const { error, value } = password_reset_token_schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const jwt = req.params.confirm_token;
        const secretKey = new TextEncoder().encode(config.SECRET_KEY);
        const { payload } = await jose.jwtVerify(jwt, secretKey);
        
        const result = await User.findByPk(payload.id);
        const salt = crypto.randomBytes(16).toString("hex");
        const password_hash = await scrypt(value.new_password, salt, config.KEYLEN_PASS);
        const password = salt+":"+password_hash.toString("hex");
        result.password = password;
        await result.save({ fields: ["password"] });

        res.status(200).json({ message: "Success set new password" });
    } catch (err) {
        if (err.code === "ERR_JWT_EXPIRED") {
            res.status(401).json({ error: "Token has expired"});
        } else {
            res.status(400).json({ error: err.message });
        }
    }
};