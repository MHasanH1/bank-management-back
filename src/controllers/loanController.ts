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
 *     summary: Register a new loan for a customer's account
 *     tags: [Loans]
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
 *               - total_amount
 *               - interest_rate
 *               - start_date
 *               - end_date
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
 *                 example: "2026-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2028-01-01"
 *     responses:
 *       201:
 *         description: Loan registered successfully
 *       400:
 *         description: Missing fields or invalid values (e.g., total_amount must be greater than 0)
 *       404:
 *         description: Bank account not found
 *       500:
 *         description: Internal server error
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
 *         description: The internal Loan ID
 *     responses:
 *       200:
 *         description: Loan status and installment list retrieved successfully
 *       404:
 *         description: Loan not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/installments/{installmentId}/pay:
 *   put:
 *     summary: Register payment for a pending installment
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: installmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique Installment ID
 *     responses:
 *       200:
 *         description: Installment payment registered successfully
 *       400:
 *         description: Installment is already paid or cannot be processed
 *       404:
 *         description: Installment not found
 *       500:
 *         description: Internal server error
 */

class LoanController extends Controller {
  async registerLoan(req: Request, res: Response): Promise<void> {
    const { account_id, total_amount, interest_rate, start_date, end_date } =
      req.body;

    if (
      !account_id ||
      !total_amount ||
      interest_rate === undefined ||
      !start_date ||
      !end_date
    )
      return this.errorResponse(res, 400, "All fields are required.");

    if (Number(total_amount) <= 0) {
      return this.errorResponse(
        res,
        400,
        "Total amount must be greater than 0.",
      );
    }

    try {
      const accountCheck = await pool.query(
        "SELECT account_id FROM Account WHERE account_id = $1",
        [account_id],
      );

      if (accountCheck.rows.length === 0)
        return this.errorResponse(res, 404, "Target bank account not found.");

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
        SELECT v.*, 
               COALESCE(json_agg(i.*) FILTER (WHERE i.installment_id IS NOT NULL), '[]') as installments
        FROM vw_customer_loans v
        LEFT JOIN Installment i ON v.loan_id = i.loan_id
        WHERE v.loan_id = $1
        GROUP BY 
               v.loan_id, 
               v.customer_id, 
               v.customer_name, 
               v.national_id, 
               v.account_number, 
               v.loan_amount, 
               v.interest_rate, 
               v.loan_status, 
               v.start_date, 
               v.end_date;
      `;
      const result = await pool.query(query, [loanId]);

      if (result.rows.length === 0) {
        return this.errorResponse(res, 404, "Loan not found.");
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
      const installmentCheck = await pool.query(
        "SELECT status FROM Installment WHERE installment_id = $1",
        [installmentId],
      );

      if (installmentCheck.rows.length === 0) {
        return this.errorResponse(res, 404, "Installment not found.");
      }

      const currentStatus = installmentCheck.rows[0].status;
      if (currentStatus === "Paid") {
        return this.errorResponse(
          res,
          400,
          "This installment has already been paid.",
        );
      }

      const query = `
            UPDATE Installment 
            SET status = 'Paid', payment_date = CURRENT_DATE 
            WHERE installment_id = $1
            RETURNING *;
        `;
      const result = await pool.query(query, [installmentId]);

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
