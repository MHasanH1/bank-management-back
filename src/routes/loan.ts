import express from "express";
import { loanController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:loanId", loanController.getLoanStatus);
router.post("/", authorizeRole([1, 2]), loanController.registerLoan);

export default router;
