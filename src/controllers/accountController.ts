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
 *         description: شماره حساب
 *     responses:
 *       200:
 *         description: Bank account details retrieved successfully
 */

/**
 * @swagger
 * /api/accounts/{accountNumber}/close:
 *   put:
 *     summary: Close a bank account (change status)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Account number
 *     responses:
 *       200:
 *         description: Bank account closed successfully
 */

class AccountController extends Controller {
  async openAccount(req: Request, res: Response): Promise<void> {
    const { account_number, customer_id, branch_id, account_type_id } =
      req.body;

    try {
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

      if (result.rows.length === 0)
        return this.errorResponse(res, 404, "Bank account not found.");

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

      if (result.rows.length === 0)
        return this.errorResponse(res, 404, "Bank account not found.");

      this.successResponse(
        res,
        200,
        "Bank account closed successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      this.errorResponse(
        res,
        500,
        "Error occurred while closing the bank account.",
      );
    }
  }
}

export default new AccountController();
