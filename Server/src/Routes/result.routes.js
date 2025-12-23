const router = require("express").Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const { consentGateMiddleware } = require("../middlewares/consentGate.middleware");
const resultController = require("../controllers/result.controller");

router.get("/", authMiddleware, consentGateMiddleware, resultController.list);
router.get("/trends", authMiddleware, consentGateMiddleware, resultController.trends);
router.get("/:resultId", authMiddleware, consentGateMiddleware, resultController.getById);

module.exports = router;
