import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management and retrieval
 */

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     summary: Deposit funds into an account
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 500000
 *               description:
 *                 type: string
 *                 example: Deposit
 *     responses:
 *       201:
 *         description: Deposit completed successfully
 *       400:
 *         description: Invalid transaction type or insufficient account balance
 */

/**
 * @swagger
 * /api/transactions/withdraw:
 *   post:
 *     summary: Withdraw funds from an account
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 200000
 *               description:
 *                 type: string
 *                 example: Withdrawal
 *     responses:
 *       201:
 *         description: Withdrawal completed successfully
 *       400:
 *         description: Insufficient account balance
 */

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Transfer funds between two accounts
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               destination_account_id:
 *                 type: integer
 *                 example: 2
 *               amount:
 *                 type: number
 *                 example: 150000
 *               description:
 *                 type: string
 *                 example: Transfer funds for rent
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 */

class TransactionController extends Controller {
  async executeTransaction(
    accountId: number,
    typeTitle: string,
    amount: number,
    destAccountId: number | null,
    description: string,
    res: Response,
  ) {
    try {
      const typeQuery = `SELECT transaction_type_id FROM TransactionType WHERE title = $1;`;
      const typeResult = await pool.query(typeQuery, [typeTitle]);

      if (typeResult.rows.length === 0) {
        return this.errorResponse(res, 400, "Invalid transaction type.");
      }

      const typeId = typeResult.rows[0].transaction_type_id;

      const insertQuery = `
            INSERT INTO Transaction (account_id, transaction_type_id, amount, destination_account_id, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
      const insertValues = [
        accountId,
        typeId,
        amount,
        destAccountId,
        description,
      ];

      const result = await pool.query(insertQuery, insertValues);
      this.successResponse(
        res,
        201,
        "Transaction completed successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      if (error.code === "23514") {
        return this.errorResponse(res, 400, "Insufficient account balance.");
      }
      console.error(`Error in ${typeTitle}:`, error);
      this.errorResponse(
        res,
        500,
        "Error occurred while processing transaction.",
      );
    }
  }

  async deposit(req: Request, res: Response): Promise<void> {
    const { account_id, amount, description } = req.body;
    await this.executeTransaction(
      account_id,
      "Deposit",
      amount,
      null,
      description,
      res,
    );
  }

  async withdraw(req: Request, res: Response): Promise<void> {
    const { account_id, amount, description } = req.body;
    await this.executeTransaction(
      account_id,
      "Withdrawal",
      amount,
      null,
      description,
      res,
    );
  }

  async transfer(req: Request, res: Response): Promise<void> {
    const { account_id, destination_account_id, amount, description } =
      req.body;
    if (!destination_account_id) {
      res.status(400).json({ error: "Destination account ID is required." });
      return;
    }
    await this.executeTransaction(
      account_id,
      "Transfer",
      amount,
      destination_account_id,
      description,
      res,
    );
  }
}

export default new TransactionController();
