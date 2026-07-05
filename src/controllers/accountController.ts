import type { Request, Response } from "express";
import { pool } from "../db";

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

export const openAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { account_number, customer_id, branch_id, account_type_id } = req.body;

  try {
    const query = `
            INSERT INTO Account (account_number, customer_id, branch_id, account_type_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
    const values = [account_number, customer_id, branch_id, account_type_id];

    const result = await pool.query(query, values);
    res.status(201).json({
      message: "New bank account opened successfully.",
      account: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error opening account:", error);
    res
      .status(500)
      .json({ error: "Error occurred while opening the bank account." });
  }
};

export const getAccountDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { accountNumber } = req.params;

  try {
    const query = `SELECT * FROM vw_customer_accounts WHERE account_number = $1;`;
    const result = await pool.query(query, [accountNumber]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Bank account not found." });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching account details:", error);
    res
      .status(500)
      .json({ error: "Error occurred while fetching account details." });
  }
};

export const closeAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
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
      res.status(404).json({ message: "Bank account not found." });
      return;
    }

    res
      .status(200)
      .json({
        message: "Bank account closed successfully.",
        account: result.rows[0],
      });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error occurred while closing the bank account." });
  }
};
