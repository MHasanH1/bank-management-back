import express from "express";
import { employeeController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authorizeRole(1), employeeController.registerEmployee);

export default router;
