// auth.js

const jwt = require("jsonwebtoken");

// Fonction pour générer un token JWT
function generateToken(user) {
  const secretKey = process.env["CLE_TOKEN"];
  const payload = {};
  return jwt.sign(payload, secretKey, { expiresIn: "5h" });
}

// Fonction pour vérifier un token JWT
function verifyToken(token) {
  const secretKey = process.env["CLE_TOKEN"];
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
