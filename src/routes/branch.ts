import express from "express";
import { authorizeRole } from "../middleware/authMiddleware";
import { branchController } from "../controllers";

const router = express.Router();

router.get("/search", authorizeRole([1]), branchController.searchBranch);
router.post("/", authorizeRole([1]), branchController.addBranch);
router.patch("/:id", authorizeRole([1]), branchController.updateBranch);
router.delete("/:id", authorizeRole([1]), branchController.deleteBranch);

export default router;
