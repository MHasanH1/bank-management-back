import express from "express";
import { employeeController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authorizeRole([1]), employeeController.getAllEmployees);
router.post("/", authorizeRole([1]), employeeController.registerEmployee);
router.patch("/:id/promote", authorizeRole([1]), employeeController.promoteEmployee);
router.patch("/:id/demote", authorizeRole([1]), employeeController.demoteEmployee);
router.delete("/:id", authorizeRole([1]), employeeController.deleteEmployee);

export default router;
