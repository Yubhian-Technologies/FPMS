import express from 'express';
import { getSuperadminData } from './superAdminController.js';
export const getUserCollegeDeadline = async (req, res) => {
  try {
    console.log("DEBUG: req.user ->", req.user);

    if (!req.user) {
      console.log("No req.user found!");
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    let userCollege = req.user.college;
    console.log("DEBUG: userCollege from req.user ->", userCollege);

    // Fallback if college not in req.user
    if (!userCollege) {
      console.log("No college in req.user, fetching from DB...");
      const userDoc = await db.collection("users").doc(req.user.id).get();
      console.log("DEBUG: userDoc.exists ->", userDoc.exists);
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: "User not found in DB" });
      }

      userCollege = userDoc.data()?.college;
      console.log("DEBUG: userCollege from DB ->", userCollege);
    }

    if (!userCollege) {
      console.log("User college is still not set!");
      return res.status(400).json({ success: false, message: "User college not set" });
    }

    // Fetch superadmin data (contains all colleges)
    const superadminData = await getSuperadminData();
    console.log("DEBUG: superadminData ->", superadminData);

    const colleges = Array.isArray(superadminData?.colleges) ? superadminData.colleges : [];
    console.log("DEBUG: colleges array ->", colleges.map(c => ({ name: c.name, deadline: c.deadline })));

    // Find college by name (case-insensitive)
    const collegeData = colleges.find(
      (c) => c?.name && c.name.toLowerCase() === userCollege.toLowerCase()
    );

    console.log("DEBUG: collegeData found ->", collegeData);

    if (!collegeData) {
      console.log("No matching college found for userCollege:", userCollege);
      return res.status(404).json({ success: false, message: "College data not found" });
    }

    console.log("Returning deadline:", collegeData.deadline);

    return res.status(200).json({
      success: true,
      data: {
        name: collegeData.name,
        deadline: collegeData.deadline || null,
      },
    });
  } catch (error) {
    console.error("Error fetching college deadline:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};