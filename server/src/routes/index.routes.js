import express from "express";
import healthRouter from "./health.routes.js";
import generatorRouter from "./generator.routes.js";

const router = express.Router();

router.use("/health", healthRouter);
router.use("/", generatorRouter);

export default router;