import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { signupSchema, loginSchema } from "../validators/auth.validator.js";

const prisma = new PrismaClient();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const signup = async (req, res, next) => {
  try {
    const validated = signupSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: validated.email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful.",
      data: { user: userWithoutPassword, token },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ success: true, message: "Logged out successfully." });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required." });
    }

    // Check email uniqueness
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: req.user.id } },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use by another account." });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json({ success: true, message: "Profile updated.", data: { user } });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            projectMembers: true,
            assignedTasks: true,
          },
        },
      },
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
