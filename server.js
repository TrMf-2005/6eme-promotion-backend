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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
