import express from "express";
import {
  adminLogin,
  addHod,
  getAllHods,
  getHodRoleOption,
  getPrincipalCollegeDetails,
  updatePrincipalCollegeBranches,
  updateHod,
  deleteHod,
  getCollegeDashboard,
} from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);

adminRouter.post("/add-hod", adminAuth, addHod);

adminRouter.get("/all-hods", adminAuth, getAllHods);
adminRouter.get("/hod-role", adminAuth, getHodRoleOption);
adminRouter.get("/college-details", adminAuth, getPrincipalCollegeDetails);
adminRouter.put("/college-branches", adminAuth, updatePrincipalCollegeBranches);

adminRouter.delete("/delete/:id", adminAuth, deleteHod);
adminRouter.put("/update/:id", adminAuth, updateHod);
adminRouter.get('/college-dashboard',adminAuth,getCollegeDashboard);

export default adminRouter;
