import express from "express";
import dotenv from "dotenv";
import { setupSwagger } from "./swagger";
import { registerUser, loginUser } from "./controllers/authController";
import {
  authenticateToken,
  authorizeRole,
} from "./middleware/authMiddleware";
import {
  addCustomer,
  searchCustomer,
  updateCustomer,
} from "./controllers/customerController";
import {
  openAccount,
  getAccountDetails,
  closeAccount,
} from "./controllers/accountController";
import {
  deposit,
  withdraw,
  transfer,
} from "./controllers/transactionController";
import {
  registerLoan,
  getLoanStatus,
  payInstallment,
} from "./controllers/loanController";
import { registerEmployee } from "./controllers/employeeController";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

setupSwagger(app);

app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);

app.post("/api/customers", authenticateToken, authorizeRole(2), addCustomer);
app.get("/api/customers/search", authenticateToken, searchCustomer);
app.put(
  "/api/customers/:id",
  authenticateToken,
  authorizeRole(2),
  updateCustomer,
);

app.post("/api/accounts", authenticateToken, authorizeRole(2), openAccount);
app.get("/api/accounts/:accountNumber", authenticateToken, getAccountDetails);
app.put(
  "/api/accounts/:accountNumber/close",
  authenticateToken,
  authorizeRole(2),
  closeAccount,
);

app.post("/api/transactions/deposit", authenticateToken, deposit);
app.post("/api/transactions/withdraw", authenticateToken, withdraw);
app.post("/api/transactions/transfer", authenticateToken, transfer);

app.post("/api/loans", authenticateToken, authorizeRole(2), registerLoan);
app.get("/api/loans/:loanId", authenticateToken, getLoanStatus);

app.put(
  "/api/installments/:installmentId/pay",
  authenticateToken,
  authorizeRole(2),
  payInstallment,
);

app.post(
  "/api/employees",
  authenticateToken,
  authorizeRole(1),
  registerEmployee,
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
