require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Settings = require('./models/Settings');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const principalRoutes = require('./routes/principal');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' })); // limite généreuse pour les photos en base64

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/principal', principalRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Crée le tout premier compte admin principal (Régis) et les réglages de
// base au premier démarrage, s'ils n'existent pas encore.
async function bootstrap() {
  const existeDejaUnPrincipal = await Admin.findOne({ role: 'principal' });
  if (!existeDejaUnPrincipal) {
    const passwordHash = await bcrypt.hash(
      process.env.BOOTSTRAP_ADMIN_PASSWORD || 'change_me',
      10
    );
    await Admin.create({
      username: process.env.BOOTSTRAP_ADMIN_USERNAME || 'regis',
      passwordHash,
      role: 'principal',
      displayName: 'Régis',
      mustChangePassword: true,
    });
    console.log('Compte admin principal créé avec le mot de passe temporaire du .env');
  }

  const settingsExistantes = await Settings.findOne();
  if (!settingsExistantes) {
    const accessPasswordHash = await bcrypt.hash('a-changer', 10);
    await Settings.create({ accessPasswordHash });
    console.log('Réglages initiaux créés — pensez à définir le vrai mot de passe d\'accès depuis l\'admin.');
  }
}

const PORT = process.env.PORT || 4000;

connectDB().then(async () => {
  await bootstrap();
  app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
});
