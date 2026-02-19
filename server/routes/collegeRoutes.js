import express from "express";
import { getUserCollegeDeadline } from "../controllers/collegeController.js";
import optionalAuth from "../middleware/optionalAuth.js";

const collegeRouter = express.Router();

collegeRouter.get("/user-deadline", optionalAuth, getUserCollegeDeadline);

export default collegeRouter;