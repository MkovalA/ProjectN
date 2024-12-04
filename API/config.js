require("dotenv").config({ path: "config.env" });
const envalid = require("envalid");

const passoword_validator = envalid.makeValidator((pass) => {
    if (/^(?=.*[A-Z])[A-z0-9]+$/.test(pass)) {
        return pass;
    } else {
        throw new Error("Passwords should contain only latin letters, numbers and symbols");
    } 
});

const login_validator = envalid.makeValidator((login) => {
    if (/^[A-z0-9_]+$/.test(login)) {
        return login;
    } else {
        throw new Error("Login should contain only latin letters, numbers and _");
    } 
});

module.exports = envalid.cleanEnv(process.env, {
    SEND_EMAIL: envalid.email(),
    PASS_EMAIL: envalid.str(),
    SECRET_KEY: envalid.str(),
    SECRET_KEY_REFRESH: envalid.str(),
    PORT: envalid.port({default: 5868}),
    DB_USER: login_validator(),
    DB_PASSWORD: passoword_validator(),
    DB_NAME: envalid.str(),
    SALT: envalid.str(),
    KEYLEN_PASS: envalid.num()
});