import express, { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
} from "../controllers/fieldsController";

const router: Router = express.Router();

router.get("/", authenticate, getFields);
router.get("/:fieldId", authenticate, getFieldById);
router.post("/", authenticate, createField);
router.put("/:fieldId", authenticate, updateField);
router.delete("/:fieldId", authenticate, deleteField);

export default router;
