/**
 * Sets a new password for a CRM user.
 *   node scripts/set-password.js <email> <new-password>
 * Reads MONGODB_URI from .env.local (this is the live database).
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error("Usage: node scripts/set-password.js <email> <new-password (10+ characters)>");
  process.exit(1);
}
const line = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/).find((l) => l.startsWith("MONGODB_URI="));
if (!line) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}
const uri = line.slice("MONGODB_URI=".length).replace(/^["']|["']$/g, "");

(async () => {
  await mongoose.connect(uri);
  const hash = await bcrypt.hash(password, 12);
  const res = await mongoose.connection.db.collection("users").updateOne({ email: email.toLowerCase() }, { $set: { passwordHash: hash } });
  console.log(res.matchedCount ? `Password updated for ${email}` : `No user found with email ${email}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
