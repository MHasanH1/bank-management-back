import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management endpoints
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Open a new bank account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account_number
 *               - customer_id
 *               - branch_id
 *               - account_type_id
 *             properties:
 *               account_number:
 *                 type: string
 *                 example: "ACC-987654321"
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               account_type_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: New bank account opened successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Branch, Customer, or Account Type not found
 *       409:
 *         description: Account number already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/accounts/{accountNumber}:
 *   get:
 *     summary: Get bank account details
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique bank account number
 *     responses:
 *       200:
 *         description: Bank account details retrieved successfully
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/accounts/{accountNumber}/close:
 *   patch:
 *     summary: Close a bank account (change status to Closed)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique bank account number
 *     responses:
 *       200:
 *         description: Bank account closed successfully
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Internal server error
 */

class AccountController extends Controller {
  async openAccount(req: Request, res: Response): Promise<void> {
    const { account_number, customer_id, branch_id, account_type_id } =
      req.body;

    if (!account_number || !customer_id || !branch_id || !account_type_id)
      return this.errorResponse(res, 400, "All fields are required.");

    try {
      const existingBranch = await pool.query(
        "SELECT branch_id FROM Branch WHERE branch_id = $1",
        [branch_id],
      );

      if (existingBranch.rows.length === 0)
        return this.errorResponse(res, 404, "Branch not found.");

      const existingCustomer = await pool.query(
        "SELECT customer_id FROM Customer WHERE customer_id = $1",
        [customer_id],
      );

      if (existingCustomer.rows.length === 0)
        return this.errorResponse(res, 404, "Customer not found.");

      const existingType = await pool.query(
        "SELECT account_type_id FROM AccountType WHERE account_type_id = $1",
        [account_type_id],
      );
      if (existingType.rows.length === 0)
        return this.errorResponse(res, 404, "Account type not found.");

      const query = `
          INSERT INTO Account (account_number, customer_id, branch_id, account_type_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
      `;
      const values = [account_number, customer_id, branch_id, account_type_id];
      const result = await pool.query(query, values);

      this.successResponse(
        res,
        201,
        "New bank account opened successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      if (error.code === "23505")
        return this.errorResponse(res, 409, "Account number already exists.");

      console.error("Error opening account:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while opening the bank account.",
      );
    }
  }

  async getAccountDetails(req: Request, res: Response): Promise<void> {
    const { accountNumber } = req.params;

    try {
      const query = `SELECT * FROM vw_customer_accounts WHERE account_number = $1;`;
      const result = await pool.query(query, [accountNumber]);

      if (result.rows.length === 0) {
        return this.errorResponse(res, 404, "Bank account not found.");
      }

      this.successResponse(
        res,
        200,
        "Bank account details retrieved successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error fetching account details:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while fetching account details.",
      );
    }
  }

  async closeAccount(req: Request, res: Response): Promise<void> {
    const { accountNumber } = req.params;

    try {
      const query = `
          UPDATE Account 
          SET status = 'Closed' 
          WHERE account_number = $1 
          RETURNING account_number, status;
      `;
      const result = await pool.query(query, [accountNumber]);

      if (result.rows.length === 0) {
        return this.errorResponse(res, 404, "Bank account not found.");
      }

      this.successResponse(
        res,
        200,
        "Bank account closed successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error closing account:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while closing the bank account.",
      );
    }
  }
}

export default new AccountController();
