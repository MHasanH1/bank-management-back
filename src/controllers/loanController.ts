import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan and installment management and retrieval
 */

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Register new loan for customer
 *     tags: [Loans]
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
 *               total_amount:
 *                 type: number
 *                 example: 50000000
 *               interest_rate:
 *                 type: number
 *                 example: 18.5
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-01"
 *     responses:
 *       201:
 *         description: Loan registered successfully
 */

/**
 * @swagger
 * /api/loans/{loanId}:
 *   get:
 *     summary: Get loan status and installment list
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: loanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan status and installment list retrieved successfully
 */

/**
 * @swagger
 * /api/installments/{installmentId}/pay:
 *   put:
 *     summary: Register payment for an installment
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: installmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Installment ID
 *     responses:
 *       200:
 *         description: Installment payment registered successfully
 */

class LoanController extends Controller {
  async registerLoan(req: Request, res: Response): Promise<void> {
    const { account_id, total_amount, interest_rate, start_date, end_date } =
      req.body;

    try {
      const query = `
            INSERT INTO Loan (account_id, total_amount, interest_rate, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
      const values = [
        account_id,
        total_amount,
        interest_rate,
        start_date,
        end_date,
      ];

      const result = await pool.query(query, values);
      this.successResponse(
        res,
        201,
        "Loan registered successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error registering loan:", error);
      this.errorResponse(res, 500, "Error occurred while registering loan.");
    }
  }

  async getLoanStatus(req: Request, res: Response): Promise<void> {
    const { loanId } = req.params;

    try {
      const query = `
            SELECT l.*, 
                   COALESCE(json_agg(i.*) FILTER (WHERE i.installment_id IS NOT NULL), '[]') as installments
            FROM Loan l
            LEFT JOIN Installment i ON l.loan_id = i.loan_id
            WHERE l.loan_id = $1
            GROUP BY l.loan_id;
        `;
      const result = await pool.query(query, [loanId]);

      if (result.rows.length === 0) {
        this.errorResponse(res, 404, "Loan not found.");
        return;
      }

      this.successResponse(
        res,
        200,
        "Loan status and installment list retrieved successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error fetching loan status:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while fetching loan status.",
      );
    }
  }

  async payInstallment(req: Request, res: Response): Promise<void> {
    const { installmentId } = req.params;

    try {
      const query = `
            UPDATE Installment 
            SET status = 'Paid', payment_date = CURRENT_DATE 
            WHERE installment_id = $1 AND status = 'Pending'
            RETURNING *;
        `;
      const result = await pool.query(query, [installmentId]);

      if (result.rows.length === 0)
        return this.errorResponse(
          res,
          400,
          "Installment not found or already paid.",
        );

      this.successResponse(
        res,
        200,
        "Installment payment registered successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error paying installment:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while registering installment payment.",
      );
    }
  }
}

export default new LoanController();
