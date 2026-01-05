import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserProgress,
} from "../controllers/usersController";

const router: Router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, uploadAvatar, updateProfile);

export default router;
