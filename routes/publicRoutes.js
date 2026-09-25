const express = require("express");
const router = express.Router();
const { verifySiteAccess } = require("../middleware/auth");
const memberController = require("../controllers/memberController");
const settingsController = require("../controllers/settingsController");

router.get("/site-info", settingsController.getPublicSiteInfo);
router.post("/members/submit", verifySiteAccess, memberController.submitMember);
router.get("/members", verifySiteAccess, memberController.getValidatedMembers);
router.get("/members/:id", verifySiteAccess, memberController.getValidatedMemberDetail);

module.exports = router;
