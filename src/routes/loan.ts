import express from "express";
import { loanController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authorizeRole(2), loanController.registerLoan);
router.get("/:loanId", loanController.getLoanStatus);

export default router;
