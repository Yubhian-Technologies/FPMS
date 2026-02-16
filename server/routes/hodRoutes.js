import express from "express";
import {
  hodLogin,
  addFaculty,
  getAllFaculty,
  getFacultyRoleOption,
  getHodCollegeDetails,
  getHodCollegeDesignations,
  updateHodCollegeDesignations,
  updateFaculty,
  deleteFaculty,
} from "../controllers/hodController.js";
import { hodAuth } from "../middleware/hodAuth.js";

const hodRouter = express.Router();

hodRouter.post("/login", hodLogin);

hodRouter.post("/add-faculty", hodAuth, addFaculty);

hodRouter.get("/all-faculty", hodAuth, getAllFaculty);
hodRouter.get("/college-details", hodAuth, getHodCollegeDetails);
hodRouter.get("/faculty-role", hodAuth, getFacultyRoleOption);
hodRouter.get("/designations", hodAuth, getHodCollegeDesignations);
hodRouter.put("/designations", hodAuth, updateHodCollegeDesignations);

hodRouter.put("/update-faculty/:id", hodAuth, updateFaculty);

hodRouter.delete("/delete-faculty/:id", hodAuth, deleteFaculty);

export default hodRouter;
