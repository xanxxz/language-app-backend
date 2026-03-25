import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/client";
import authRoutes from "./routes/auth.routes";
import lessonRoutes from "./routes/lesson.routes";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use('/api', lessonRoutes);
app.use("/api", adminRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

pool.connect()
  .then(() => console.log("DB connected ✅"))
  .catch((err) => console.error("DB error ❌", err));