import jwt from "jsonwebtoken";

export const generateToken = (userId: number, role: string) => {
  return jwt.sign(
    { userId, role }, // 👈 добавили роль
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};