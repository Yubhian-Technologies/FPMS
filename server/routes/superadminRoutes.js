import express from "express";
import {
  createForm,
  createCollege,
  createRole,
  deleteForm,
  deleteCollege,
  deleteCommitteeMember,
  deleteRole,
  getFormById,
  getForms,
  getColleges,
  getCommitteeMember,
  getRoles,
  registerCommitteeMember,
  updateForm,
  updateCollege,
  updateCommitteeMember,
  updateRole,
} from "../controllers/superadminController.js";
import { superadminAuth } from "../middleware/superadminAuth.js";

const superadminRouter = express.Router();

superadminRouter.get("/roles", superadminAuth, getRoles);
superadminRouter.post("/roles", superadminAuth, createRole);
superadminRouter.put("/roles/:id", superadminAuth, updateRole);
superadminRouter.delete("/roles/:id", superadminAuth, deleteRole);

superadminRouter.get("/colleges", superadminAuth, getColleges);
superadminRouter.post("/colleges", superadminAuth, createCollege);
superadminRouter.put("/colleges/:id", superadminAuth, updateCollege);
superadminRouter.delete("/colleges/:id", superadminAuth, deleteCollege);

superadminRouter.post(
  "/committee-member/register",
  superadminAuth,
  registerCommitteeMember,
);
superadminRouter.get("/committee-member", superadminAuth, getCommitteeMember);
superadminRouter.put(
  "/committee-member",
  superadminAuth,
  updateCommitteeMember,
);
superadminRouter.delete(
  "/committee-member",
  superadminAuth,
  deleteCommitteeMember,
);

superadminRouter.get("/forms", superadminAuth, getForms);
superadminRouter.get("/forms/:id", superadminAuth, getFormById);
superadminRouter.post("/forms", superadminAuth, createForm);
superadminRouter.put("/forms/:id", superadminAuth, updateForm);
superadminRouter.delete("/forms/:id", superadminAuth, deleteForm);

export default superadminRouter;
