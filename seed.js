require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const Settings = require("./models/Settings");

async function seed() {
  await connectDB();

  const existingPrincipal = await Admin.findOne({ role: "principal" });
  if (!existingPrincipal) {
    const passwordHash = await bcrypt.hash(process.env.SEED_PRINCIPAL_TEMP_PASSWORD, 10);
    await Admin.create({
      username: process.env.SEED_PRINCIPAL_USERNAME,
      displayName: "Régis",
      passwordHash,
      role: "principal",
      mustChangePassword: true,
    });
    console.log("Admin principal créé. Connecte-toi puis choisis ton mot de passe définitif.");
  } else {
    console.log("Un admin principal existe déjà, rien à faire.");
  }

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    const sitePasswordHash = await bcrypt.hash("a-changer", 10);
    await Settings.create({ siteName: "Notre promo", sitePasswordHash });
    console.log("Réglages par défaut créés (mot de passe d'accès : 'a-changer', à modifier).");
  }

  process.exit(0);
}

seed();
