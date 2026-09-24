require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" })); // limite relevée pour les photos en base64

app.use("/api", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("API du site de la promo — OK"));
// ⚠️ Route temporaire : permet d'initialiser le compte admin principal et
// les réglages par défaut sans avoir accès au Shell Render (plan gratuit).
// À SUPPRIMER du code une fois l'initialisation faite.
app.get("/api/dev/seed", async (req, res) => {
  if (req.query.key !== process.env.SEED_KEY) {
    return res.status(403).send("Clé incorrecte.");
  }
  try {
    const bcrypt = require("bcryptjs");
    const Admin = require("./models/Admin");
    const Settings = require("./models/Settings");

    let message = "";

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
      message += "Admin principal créé. ";
    } else {
      message += "Admin principal déjà existant. ";
    }

    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      const sitePasswordHash = await bcrypt.hash("a-changer", 10);
      await Settings.create({ siteName: "Notre promo", sitePasswordHash });
      message += "Réglages par défaut créés (mot de passe d'accès : 'a-changer').";
    } else {
      message += "Réglages déjà existants.";
    }

    res.send(message);
  } catch (err) {
    res.status(500).send("Erreur : " + err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
