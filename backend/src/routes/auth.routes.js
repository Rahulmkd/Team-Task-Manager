import { Router } from "express";
import { signup, login, logout, getMe, updateProfile, updatePassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.put("/password", authenticate, updatePassword);

export default router;
