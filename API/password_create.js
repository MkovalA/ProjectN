const crypto = require("crypto");
const config = require("./config");

async function generatePassword() {
  const salt = crypto.randomBytes(16).toString("hex");
  try {
    const password_hash = await crypto.scryptSync("1234567U3", salt, config.KEYLEN_PASS);
    const password = salt + ":" + password_hash.toString("hex");
    console.log(password);
  } catch (err) {
    console.error("Error generating password hash:", err);
  }
}

generatePassword();
