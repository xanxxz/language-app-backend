import { Router } from "express";
import { pool } from "../db/client";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// ✅ REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "All fields required" });
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await hashPassword(password);

    const result = await pool.query(
      `
      INSERT INTO users (email, password, username, language_code, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, username, language_code, role
      `,
      [email, hashed, username, "en", "user"]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language_code: user.language_code,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        language_code: user.language_code,
        role: user.role,
      },
      token,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET ME
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.language_code,
        u.role, -- 👈 ДОБАВИЛИ
        l.label as language_label
      FROM users u
      LEFT JOIN languages l 
        ON u.language_code = l.code
      WHERE u.id = $1
      `,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CHANGE LANGUAGE
router.patch("/language", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { language_code } = req.body;

    if (!language_code) {
      return res.status(400).json({ error: "language_code required" });
    }

    const result = await pool.query(
      `
      UPDATE users 
      SET language_code = $1 
      WHERE id = $2 
      RETURNING id, email, username, language_code
      `,
      [language_code, req.user.id]
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ CHANGE USERNAME
router.patch("/username", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "username required" });
    }

    const result = await pool.query(
      `
      UPDATE users 
      SET username = $1 
      WHERE id = $2 
      RETURNING id, email, username, language_code
      `,
      [username, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;