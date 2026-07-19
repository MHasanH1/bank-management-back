import express from "express";
import { employeeController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authorizeRole([1]), employeeController.registerEmployee);
router.patch("/:id/promote", authorizeRole([1]), employeeController.promoteEmployee);
router.delete("/:id", authorizeRole([1]), employeeController.deleteEmployee);

export default router;
