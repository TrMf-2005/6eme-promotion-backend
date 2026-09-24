const express = require("express");
const router = express.Router();
const { verifyAdmin, requirePrincipal } = require("../middleware/auth");
const memberController = require("../controllers/memberController");
const adminController = require("../controllers/adminController");
const settingsController = require("../controllers/settingsController");

router.use(verifyAdmin); // toutes les routes ci-dessous exigent une session admin valide

// --- Communes aux 3 administrateurs ---
router.get("/stats", memberController.getStats);
router.get("/pending", memberController.getPendingMembers);
router.get("/pending/:id", memberController.getMemberDetail);
router.post("/pending/:id/validate", memberController.validateMember);
router.post("/pending/:id/refuse", memberController.refuseMember);
router.get("/members", memberController.searchMembers);
router.post("/members", memberController.updateMember); // ajout manuel (réutilise l'update sur un nouveau doc si besoin d'adapter)
router.put("/members/:id", memberController.updateMember);
router.delete("/members/:id", memberController.deleteMember);
router.get("/members/export", memberController.exportMembers);

router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);
router.put("/settings/password", settingsController.updateSitePassword);

// --- Réservées à l'admin principal ---
router.get("/logs", requirePrincipal, adminController.getLogs);
router.get("/admins", requirePrincipal, adminController.listAdmins);
router.post("/admins", requirePrincipal, adminController.createSubordinateAdmin);
router.delete("/admins/:id", requirePrincipal, adminController.deleteAdmin);

module.exports = router;
