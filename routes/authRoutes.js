const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/public/verify-access", authController.verifySiteAccess);
router.post("/admin/login", authController.adminLogin);
router.post("/admin/set-password", authController.setInitialPassword);

module.exports = router;
