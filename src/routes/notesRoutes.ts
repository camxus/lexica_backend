import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController";

const router: Router = express.Router();

router.get("/", authenticate, getNotes);
router.get("/:noteId", authenticate, getNoteById);
router.post("/", authenticate, createNote);
router.put("/:noteId", authenticate, updateNote);
router.delete("/:noteId", authenticate, deleteNote);

export default router;
