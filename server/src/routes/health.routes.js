import express from "express";

import controller from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", controller.check);
router.get("/metrics", controller.getMetrics);

export default router;