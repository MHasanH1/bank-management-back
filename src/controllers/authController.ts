import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import jwt from "jsonwebtoken";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user in the system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin_user
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               role_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system and retrieve a token (JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin_user
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful and token returned
 *       401:
 *         description: Invalid username or password
 */

export const registerUser = async (req: Request, res: Response) => {
  const { username, password, role_id } = req.body;

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
            INSERT INTO SystemUser (username, password_hash, role_id)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, role_id, created_at;
        `;

    const values = [username, passwordHash, role_id];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error in registration:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const query = `SELECT * FROM SystemUser WHERE username = $1;`;
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const token = jwt.sign(
      { userId: user.user_id, roleId: user.role_id },
      process.env.JWT_SECRET || "super_secret_bank_key",
      { expiresIn: "2h" },
    );

    res.status(200).json({
      message: "Login successful.",
      token,
    });
  } catch (error: any) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
