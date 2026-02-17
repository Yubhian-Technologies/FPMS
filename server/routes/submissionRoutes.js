import express from "express";
import {
  submitTask,
  getMySubmissions,
  getReviewQueue,
  getReviewedSubmissions,
  reviewSubmission,
  acceptReview,
  raiseAppeal,
  getAppealQueue,
  reviewAppeal,
  getResolvedAppeals,
  getUserTotal,
} from "../controllers/submissionController.js";
import optionalAuth from "../middleware/optionalAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Apply optional auth to all routes
router.use(optionalAuth);

// Faculty endpoints
router.post("/submit",upload.single("file"), submitTask);
router.get("/my-submissions", getMySubmissions);
router.post("/:id/accept", acceptReview);
router.post("/:id/appeal", raiseAppeal);
router.get("/user-total", getUserTotal);

// Reviewer endpoints (HOD/Committee)
router.get("/review-queue", getReviewQueue);
router.get("/my-reviewed", getReviewedSubmissions);
router.post("/:id/review", reviewSubmission);

// Appeal reviewer endpoints
router.get("/appeal-queue", getAppealQueue);
router.get("/my-resolved-appeals", getResolvedAppeals);
router.post("/:id/review-appeal", reviewAppeal);

export default router;
