const jose = require('jose');
const config = require("../config");
const sequelize = require("../db");
const Sequelize = require("sequelize");
const User = require('../models/user')(sequelize, Sequelize.DataTypes);

exports.validToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(400).json({ error: "Token is missing" });
        }
        const token = authHeader.split(" ")[1];
        
        const secretKey = new TextEncoder().encode(config.SECRET_KEY);
        const { payload } = await jose.jwtVerify(token, secretKey);

        req.id = payload.id;
        next();
    } catch (err) {
        if (err.code === "ERR_JWT_EXPIRED") {
            res.status(401).json({ error: "Token has expired"});
        } else {
            res.status(400).json({ error: err.message });
        }
    }
};

exports.checkAdmin = async (req, res, next) => {
    try {
        const check_role = await User.findOne( { where: { id: req.id }} );
        if (check_role.role != "admin") {
            return res.status(403).json( { error: "You do not have rights to this resource"});
        }
        next();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};