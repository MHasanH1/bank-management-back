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
 *             required:
 *               - account_id
 *               - amount
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 500000
 *               description:
 *                 type: string
 *                 example: Monthly deposit
 *     responses:
 *       201:
 *         description: Deposit completed successfully
 *       400:
 *         description: Invalid input or missing fields
 *       404:
 *         description: Bank account not found or is not active
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - account_id
 *               - amount
 *             properties:
 *               account_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 200000
 *               description:
 *                 type: string
 *                 example: ATM Withdrawal
 *     responses:
 *       201:
 *         description: Withdrawal completed successfully
 *       400:
 *         description: Insufficient account balance or invalid amount
 *       404:
 *         description: Bank account not found or is not active
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - account_id
 *               - destination_account_id
 *               - amount
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
 *       400:
 *         description: Invalid accounts, same account transfer, or insufficient balance
 *       404:
 *         description: Source or destination account not found/active
 *       500:
 *         description: Internal server error
 */

class TransactionController extends Controller {
  private async executeTransaction(
    accountId: number,
    typeTitle: string,
    amount: number,
    destAccountId: number | null,
    description: string,
    res: Response,
  ) {
    if (!accountId || !amount || amount <= 0) {
      return this.errorResponse(
        res,
        400,
        "Valid account_id and positive amount are required.",
      );
    }

    try {
      const typeQuery = `SELECT transaction_type_id FROM TransactionType WHERE title = $1;`;
      const typeResult = await pool.query(typeQuery, [typeTitle]);

      if (typeResult.rows.length === 0) {
        return this.errorResponse(res, 400, "Invalid transaction type.");
      }

      const typeId = typeResult.rows[0].transaction_type_id;

      const srcAccountCheck = await pool.query(
        "SELECT status, balance FROM Account WHERE account_id = $1",
        [accountId],
      );
      if (srcAccountCheck.rows.length === 0) {
        return this.errorResponse(res, 404, "Source bank account not found.");
      }
      if (srcAccountCheck.rows[0].status !== "Active") {
        return this.errorResponse(
          res,
          400,
          `Source account is currently ${srcAccountCheck.rows[0].status}. Transactions are not allowed.`,
        );
      }

      if (typeTitle === "Transfer" && destAccountId) {
        if (accountId === destAccountId) {
          return this.errorResponse(
            res,
            400,
            "Source and destination accounts cannot be the same.",
          );
        }

        const destAccountCheck = await pool.query(
          "SELECT status FROM Account WHERE account_id = $1",
          [destAccountId],
        );
        if (destAccountCheck.rows.length === 0) {
          return this.errorResponse(
            res,
            404,
            "Destination bank account not found.",
          );
        }
        if (destAccountCheck.rows[0].status !== "Active") {
          return this.errorResponse(
            res,
            400,
            "Destination account is not active.",
          );
        }
      }

      let transactionResult;

      if (typeTitle === "Transfer") {
        const procedureQuery = `CALL sp_execute_transfer($1, $2, $3, $4, null);`;
        await pool.query(procedureQuery, [
          accountId,
          destAccountId,
          amount,
          description || null,
        ]);

        // Fetch the newly created transaction to return to user (since CALL doesn't return rows directly like INSERT...RETURNING)
        const fetchQuery = `SELECT * FROM Transaction WHERE account_id = $1 ORDER BY transaction_date DESC LIMIT 1`;
        const fetchResult = await pool.query(fetchQuery, [accountId]);
        transactionResult = fetchResult.rows[0];
      } else {
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
          description || null,
        ];
        const result = await pool.query(insertQuery, insertValues);
        transactionResult = result.rows[0];
      }

      this.successResponse(
        res,
        201,
        "Transaction completed successfully.",
        transactionResult,
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
      return this.errorResponse(
        res,
        400,
        "Destination account ID is required.",
      );
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
