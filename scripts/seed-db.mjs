import dbConnect from "../src/lib/db.js";
import User from "../src/models/User.js";
import Lead from "../src/models/Lead.js";
import Pipeline from "../src/models/Pipeline.js";
import bcrypt from "bcryptjs";

// Load .env.local
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("Seeding Tzar CRM database...");
