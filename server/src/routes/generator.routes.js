import express from "express";
import controller from "../controllers/generator.controller.js";

const router = express.Router();

router.get("/tech", controller.getTech);
router.post("/generate", controller.generate);

export default router;
