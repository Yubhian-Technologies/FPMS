//hodController

import bcrypt from "bcryptjs";
import { db, auth } from "../config/firebase.js";
import admin from "firebase-admin";

const SUPERADMIN_DOC_ID = process.env.SUPERADMIN_DOC_ID || "root";
const USERS_COLLECTION = "users";

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.map((item) => String(item || "").trim()).filter(Boolean)),
  );
};

const isFacultyRole = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "faculty" || normalized.startsWith("faculty");
};

export const hodLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const snapshot = await db
      .collection("hods")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const hodDoc = snapshot.docs[0];
    const hodData = hodDoc.data();

    const isMatch = await bcrypt.compare(password, hodData.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "HOD login successful",
      user: {
        id: hodDoc.id,
        uid: hodDoc.id,
        name: hodData.name,
        email: hodData.email,
        role: "hod",
        college: hodData.college || "",
        department: hodData.department || "",
      },
    });
  } catch (error) {
    console.error("HOD login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addFaculty = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      pass,
      confirmPassword,
      confirm_pass,
      department,
      college,
      designation,
      level,
      experience,
      isActive,
      hasPhd,
    } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedDepartment = String(department || "").trim();
    const normalizedDesignation = String(designation || "").trim();
    const normalizedCollege = String(college || "").trim();
    const hodCollege = String(req.hod?.college || "").trim();
    const resolvedCollege = hodCollege || normalizedCollege;
    const resolvedPassword = String(password ?? pass ?? "");
    const resolvedConfirmPassword = String(
      confirmPassword ?? confirm_pass ?? "",
    );
    const normalizedLevel = Number(level);

    if (
      !normalizedName ||
      !normalizedEmail ||
      !resolvedPassword ||
      !normalizedDepartment ||
      !normalizedDesignation ||
      !resolvedCollege ||
      experience === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (!Number.isFinite(normalizedLevel)) {
      return res.status(400).json({
        success: false,
        message: "Level is required",
      });
    }

    if (resolvedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (
      resolvedConfirmPassword &&
      resolvedPassword !== resolvedConfirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation does not match",
      });
    }

    try {
      await auth.getUserByEmail(normalizedEmail);
      return res.status(409).json({
        success: false,
        message: "Faculty already exists",
      });
    } catch (error) {
      if (error?.code && error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password: resolvedPassword,
      displayName: normalizedName,
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      role: "faculty",
      level: normalizedLevel,
      college: resolvedCollege,
      department: normalizedDepartment,
      faculty: true,
    });

    const hashedPassword = await bcrypt.hash(resolvedPassword, 10);

    await db
      .collection(USERS_COLLECTION)
      .doc(userRecord.uid)
      .set(
        {
          uid: userRecord.uid,
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          department: normalizedDepartment,
          college: resolvedCollege,
          designation: normalizedDesignation,
          level: normalizedLevel,
          experience: Number(experience),
          isActive: Boolean(isActive),
          hasPhd: Boolean(hasPhd),
          role: "faculty",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return res.status(201).json({
      success: true,
      message: "Faculty added successfully",
    });
  } catch (error) {
    console.error("Add Faculty Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllFaculty = async (req, res) => {
  try {
    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
            console.log(
              "[getAllFaculty] Fetched college from users collection:",
              hodCollege,
            );
          }
        } catch (err) {
          console.error(
            "[getAllFaculty] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    const hodCollegeLower = hodCollege.toLowerCase();
    console.log("[getAllFaculty] START - HOD college:", hodCollege);

    const snapshot = await db.collection(USERS_COLLECTION).get();
    console.log("[getAllFaculty] Total users in DB:", snapshot.size);

    const facultyList = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((item) => isFacultyRole(item.role || ""))
      .filter((item) => {
        if (!hodCollegeLower) return true;
        const itemCollege = String(item.college || "")
          .trim()
          .toLowerCase();
        return itemCollege === hodCollegeLower;
      });

    console.log(
      "[getAllFaculty] SUCCESS - Found",
      facultyList.length,
      "faculty members for college:",
      hodCollege,
    );
    return res.status(200).json({ success: true, data: facultyList });
  } catch (error) {
    console.error("[getAllFaculty] ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      password,
      pass,
      confirmPassword,
      confirm_pass,
      department,
      college,
      designation,
      level,
      experience,
      isActive,
      hasPhd,
    } = req.body;

    const facultyRef = db.collection(USERS_COLLECTION).doc(id);
    const facultyDoc = await facultyRef.get();

    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
          }
        } catch (err) {
          console.error(
            "[updateFaculty] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    const hodCollegeLower = hodCollege.toLowerCase();

    if (!facultyDoc.exists)
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });

    if (hodCollegeLower) {
      const facultyCollege = String(facultyDoc.data()?.college || "")
        .trim()
        .toLowerCase();
      if (facultyCollege !== hodCollegeLower) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    const updateData = {};
    const currentData = facultyDoc.data() || {};
    if (name) updateData.name = String(name).trim();
    if (email) updateData.email = String(email).trim().toLowerCase();
    if (department) updateData.department = String(department).trim();
    if (college)
      updateData.college = String(req.hod?.college || college).trim();
    if (designation) updateData.designation = String(designation).trim();
    if (level !== undefined) {
      const normalizedLevel = Number(level);
      if (!Number.isFinite(normalizedLevel)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid level" });
      }
      updateData.level = normalizedLevel;
    }
    if (experience !== undefined) updateData.experience = Number(experience);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (hasPhd !== undefined) updateData.hasPhd = Boolean(hasPhd);

    const resolvedPassword = String(password ?? pass ?? "");
    const resolvedConfirmPassword = String(
      confirmPassword ?? confirm_pass ?? "",
    );
    if (resolvedPassword) {
      if (resolvedPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      if (
        resolvedConfirmPassword &&
        resolvedPassword !== resolvedConfirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message: "Password confirmation does not match",
        });
      }

      updateData.password = await bcrypt.hash(resolvedPassword, 10);
    }

    const nextName = String(updateData.name || currentData.name || "").trim();
    const nextEmail = String(updateData.email || currentData.email || "")
      .trim()
      .toLowerCase();
    const nextDepartment = String(
      updateData.department || currentData.department || "",
    ).trim();
    const nextCollege = String(
      updateData.college || currentData.college || "",
    ).trim();
    const nextLevel = Number(
      updateData.level !== undefined ? updateData.level : currentData.level,
    );

    const authUpdatePayload = {};
    if (nextName) authUpdatePayload.displayName = nextName;
    if (nextEmail) authUpdatePayload.email = nextEmail;
    if (resolvedPassword) authUpdatePayload.password = resolvedPassword;

    if (Object.keys(authUpdatePayload).length > 0) {
      await auth.updateUser(id, authUpdatePayload);
    }

    await auth.setCustomUserClaims(id, {
      role: "faculty",
      level: Number.isFinite(nextLevel) ? nextLevel : 0,
      college: nextCollege,
      department: nextDepartment,
      faculty: true,
    });

    updateData.role = "faculty";
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await facultyRef.set(updateData, { merge: true });

    return res
      .status(200)
      .json({ success: true, message: "Faculty updated successfully" });
  } catch (error) {
    console.error("Update Faculty Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
          }
        } catch (err) {
          console.error(
            "[deleteFaculty] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    const hodCollegeLower = hodCollege.toLowerCase();

    const facultyRef = db.collection(USERS_COLLECTION).doc(id);
    const facultyDoc = await facultyRef.get();

    if (!facultyDoc.exists)
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });

    if (hodCollegeLower) {
      const facultyCollege = String(facultyDoc.data()?.college || "")
        .trim()
        .toLowerCase();
      if (facultyCollege !== hodCollegeLower) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    try {
      await auth.deleteUser(id);
    } catch (authError) {
      if (authError?.code !== "auth/user-not-found") {
        throw authError;
      }
    }

    await facultyRef.delete();
    return res
      .status(200)
      .json({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("Delete Faculty Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getHodCollegeDesignations = async (req, res) => {
  try {
    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
            console.log(
              "[getHodCollegeDesignations] Fetched college from users collection:",
              hodCollege,
            );
          }
        } catch (err) {
          console.error(
            "[getHodCollegeDesignations] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    console.log("[getHodCollegeDesignations] START - HOD college:", hodCollege);

    if (!hodCollege) {
      console.log(
        "[getHodCollegeDesignations] No college specified, returning empty array",
      );
      return res.status(200).json({
        success: true,
        data: { college: "", designations: [] },
      });
    }

    const superadminDoc = await db
      .collection("superadmin")
      .doc(SUPERADMIN_DOC_ID)
      .get();

    if (!superadminDoc.exists) {
      console.log("[getHodCollegeDesignations] Superadmin doc does not exist");
      return res.status(200).json({
        success: true,
        data: { college: hodCollege, designations: [] },
      });
    }

    const superadminData = superadminDoc.data();
    const colleges = superadminData?.colleges || [];
    console.log(
      "[getHodCollegeDesignations] Total colleges found:",
      colleges.length,
    );
    console.log(
      "[getHodCollegeDesignations] College names:",
      colleges.map((c) => c?.name),
    );

    // Find matching college (case-insensitive)
    const matchedCollege = colleges.find((college) => {
      const collegeName = String(college?.name || "").trim();
      return collegeName.toLowerCase() === hodCollege.toLowerCase();
    });

    if (matchedCollege) {
      const designations = Array.isArray(matchedCollege.designations)
        ? matchedCollege.designations.filter((d) => d && String(d).trim())
        : [];
      console.log(
        "[getHodCollegeDesignations] SUCCESS - Found",
        designations.length,
        "designations:",
        designations,
      );
      return res.status(200).json({
        success: true,
        data: { college: hodCollege, designations },
      });
    } else {
      console.log(
        "[getHodCollegeDesignations] No matching college found for:",
        hodCollege,
      );
      return res.status(200).json({
        success: true,
        data: { college: hodCollege, designations: [] },
      });
    }
  } catch (error) {
    console.error("[getHodCollegeDesignations] ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateHodCollegeDesignations = async (req, res) => {
  try {
    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
            console.log(
              "[updateHodCollegeDesignations] Fetched college from users collection:",
              hodCollege,
            );
          }
        } catch (err) {
          console.error(
            "[updateHodCollegeDesignations] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    console.log("[updateHodCollegeDesignations] Using college:", hodCollege);

    if (!hodCollege) {
      return res.status(400).json({
        success: false,
        message: "HOD college not found in user profile",
      });
    }

    const nextDesignations = normalizeStringArray(req.body?.designations);

    const superadminRef = db.collection("superadmin").doc(SUPERADMIN_DOC_ID);
    const superadminDoc = await superadminRef.get();

    if (!superadminDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Superadmin settings not found",
      });
    }

    const data = superadminDoc.data() || {};
    const colleges = Array.isArray(data.colleges) ? data.colleges : [];

    console.log(
      "[updateHodCollegeDesignations] Available colleges:",
      colleges.map((c) => c?.name),
    );

    const collegeIndex = colleges.findIndex(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() === hodCollege.toLowerCase(),
    );

    if (collegeIndex === -1) {
      console.error(
        "[updateHodCollegeDesignations] College not found. Looking for:",
        hodCollege,
      );
      return res.status(404).json({
        success: false,
        message: "HOD college not found",
      });
    }

    const nextColleges = [...colleges];
    nextColleges[collegeIndex] = {
      ...nextColleges[collegeIndex],
      designations: nextDesignations,
      updatedAt: new Date().toISOString(),
    };

    await superadminRef.set(
      {
        colleges: nextColleges,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({
      success: true,
      message: "Designations updated successfully",
      data: {
        college: nextColleges[collegeIndex].name,
        designations: nextDesignations,
      },
    });
  } catch (error) {
    console.error("Update HOD college designations error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getHodCollegeDetails = async (req, res) => {
  try {
    let hodCollege = String(req.hod?.college || "").trim();

    // If college not in middleware, try fetching from users collection
    if (!hodCollege) {
      const hodUid = String(req.hod?.uid || req.hod?.id || "").trim();
      if (hodUid) {
        try {
          const hodUserDoc = await db
            .collection(USERS_COLLECTION)
            .doc(hodUid)
            .get();
          if (hodUserDoc.exists) {
            const hodData = hodUserDoc.data() || {};
            hodCollege = String(hodData.college || "").trim();
            console.log(
              "[getHodCollegeDetails] Fetched college from users collection:",
              hodCollege,
            );
          }
        } catch (err) {
          console.error(
            "[getHodCollegeDetails] Error fetching from users collection:",
            err,
          );
        }
      }
    }

    const superadminDoc = await db
      .collection("superadmin")
      .doc(SUPERADMIN_DOC_ID)
      .get();

    if (!superadminDoc.exists) {
      return res.status(200).json({
        success: true,
        data: {
          name: hodCollege,
          code: "",
          branches: [],
        },
      });
    }

    const data = superadminDoc.data() || {};
    const colleges = Array.isArray(data.colleges) ? data.colleges : [];

    const matchedCollege = colleges.find(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() === hodCollege.toLowerCase(),
    );

    const branches = Array.isArray(matchedCollege?.branches)
      ? matchedCollege.branches
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      success: true,
      data: {
        id: matchedCollege?.id,
        name: matchedCollege?.name || hodCollege,
        code: matchedCollege?.code || "",
        branches,
      },
    });
  } catch (error) {
    console.error("Get HOD college details error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getFacultyRoleOption = async (req, res) => {
  try {
    console.log("[getFacultyRoleOption] START - Called by:", req.hod?.email);

    const superadminDoc = await db
      .collection("superadmin")
      .doc(SUPERADMIN_DOC_ID)
      .get();

    if (!superadminDoc.exists) {
      console.log(
        "[getFacultyRoleOption] Superadmin doc does not exist, returning default",
      );
      return res.status(200).json({
        success: true,
        data: { name: "Faculty", level: 3 },
      });
    }

    const superadminData = superadminDoc.data();
    const roles = superadminData?.roles || [];
    console.log("[getFacultyRoleOption] Total roles found:", roles.length);
    console.log(
      "[getFacultyRoleOption] Roles:",
      roles.map((r) => `${r.name}(${r.level})`),
    );

    // Find Faculty role (case-insensitive)
    const facultyRole = roles.find((role) => {
      const roleName = String(role?.name || "")
        .trim()
        .toLowerCase();
      return roleName === "faculty";
    });

    if (facultyRole) {
      const result = {
        name: facultyRole.name,
        level: Number(facultyRole.level) || 0,
      };
      console.log(
        "[getFacultyRoleOption] SUCCESS - Found faculty role:",
        result,
      );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } else {
      console.log(
        "[getFacultyRoleOption] No Faculty role found, returning default",
      );
      return res.status(200).json({
        success: true,
        data: { name: "Faculty", level: 3 },
      });
    }
  } catch (error) {
    console.error("[getFacultyRoleOption] ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getHodDashboard = async (req, res) => {
  try {
    const { college, department } = req.hod;

    const submissionsSnap = await db.collection("submissions").get();

    const allSubmissions = submissionsSnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));

    const submissionsMap = new Map();
    allSubmissions.forEach(sub => {
      if (!submissionsMap.has(sub.userId)) {
        submissionsMap.set(sub.userId, []);
      }
      submissionsMap.get(sub.userId).push(sub);
    });

    const staffSnap = await db
      .collection("users")
      .where("college", "==", college)
      .where("department", "==", department)
      .where("role", "==", "faculty")
      .get();

    const staff = staffSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        submissions: submissionsMap.get(data.uid) || [],
      };
    });

    return res.json({
      success: true,
      data: { staff },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};