import admin from "firebase-admin";
import { db } from "../config/firebase.js";

// Submit a task (Faculty)
export const submitTask = async (req, res) => {
  try {
    const {
      formId,
      formTitle,
      criteriaId,
      criteriaName,
      taskId,
      taskName,
      moduleId,
      moduleName,
      maxMarks,
      claimedScore,
      evidence,
      description,
    } = req.body;

    const userId = req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const userEmail = req.user?.email || req.headers["x-user-email"];
    const userName =
      req.user?.name || req.user?.displayName || req.headers["x-user-name"];
    const userRole = (
      req.user?.role ||
      req.headers["x-user-role"] ||
      "faculty"
    ).toLowerCase();

    // Fetch college and department from users collection
    let college = "";
    let department = "";

    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        college = userData.college || "";
        department = userData.department || "";
      }
    }

    console.log("Submit task - User info:", {
      userId,
      userEmail,
      userName,
      userRole,
      college,
      department,
      rawRole: req.user?.role || req.headers["x-user-role"],
    });

    if (
      !userId ||
      !formId ||
      !criteriaId ||
      !taskId ||
      claimedScore === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }
    let finalEvidence = "";

    if (req.file) {
      finalEvidence = req.file.path; 
    } else {
      finalEvidence = evidence || "";
    }

    // Get workflow rules for this user role
    let workflowRules = [];
    let superAdminDoc = await db.collection("superadmin").doc("config").get();

    if (!superAdminDoc.exists) {
      superAdminDoc = await db.collection("superadmin").doc("root").get();
    }

    if (!superAdminDoc.exists) {
      const snapshot = await db.collection("superadmin").limit(1).get();
      if (!snapshot.empty) {
        superAdminDoc = snapshot.docs[0];
      }
    }

    if (!superAdminDoc.exists) {
      return res.status(400).json({
        success: false,
        message: "Superadmin configuration not found",
      });
    }

    workflowRules = superAdminDoc.data()?.workflowRules || [];

    console.log("User role:", userRole);
    console.log(
      "Available workflow rules:",
      workflowRules.map((r) => r.role),
    );
    console.log(
      "Workflow rules details:",
      JSON.stringify(workflowRules, null, 2),
    );

    const userRule = workflowRules.find(
      (r) => (r.role || "").toLowerCase().trim() === userRole.trim(),
    );

    if (
      !userRule ||
      !Array.isArray(userRule.submitToRoles) ||
      userRule.submitToRoles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: `No workflow configured for role: ${userRole}. Available roles: ${workflowRules.map((r) => r.role).join(", ")}`,
      });
    }

    const submitToRoleIds = userRule.submitToRoles.map((role) =>
      role.toLowerCase(),
    );
    const appealToRoleIds = (userRule.appealToRoles || []).map((role) =>
      role.toLowerCase(),
    );

    // Check if submission already exists for this task
    const existingSnapshot = await db
      .collection("submissions")
      .where("userId", "==", userId)
      .where("formId", "==", formId)
      .where("criteriaId", "==", criteriaId)
      .where("moduleId", "==", moduleId)
      .where("taskId", "==", taskId)
      .limit(1)
      .get();

    console.log(
      `Checking existing submission for user ${userId}, form ${formId}, criteria ${criteriaId}, module ${moduleId}, task ${taskId}: ${!existingSnapshot.empty ? "FOUND" : "NOT FOUND"}`,
    );

    if (!existingSnapshot.empty) {
      const existing = existingSnapshot.docs[0];
      console.log("Returning existing submission:", existing.id);
      return res.status(200).json({
        success: true,
        message: "Submission already exists",
        data: {
          id: existing.id,
          ...existing.data(),
          submitToRoleIds,
          appealToRoleIds,
        },
      });
    }

    console.log("Creating new submission for task:", taskId);

    // Create new submission
    const submission = {
      formId,
      formTitle: formTitle || formId,
      criteriaId,
      criteriaName: criteriaName || criteriaId,
      taskId,
      taskName: taskName || taskId,
      moduleId: moduleId || null,
      moduleName: moduleName || null,
      userId,
      userEmail: userEmail || "",
      userName: userName || "",
      userRole,
      college: college || "",
      department: department || "",
      claimedScore: Number(claimedScore),
      evidence: finalEvidence,
      description: description || "",
      maxMarks: Number(maxMarks || 0),
      reviewerScore: null,
      reviewerReason: null,
      isAppealed: false,
      appealReason: null,
      appealRequestedScore: null,
      appealerScore: null,
      appealerReason: null,
      status: "submitted",
      finalScore: null,
      submitToRoleIds,
      appealToRoleIds,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("submissions").add(submission);
    console.log("Submission created with ID:", docRef.id);

    return res.status(201).json({
      success: true,
      message: "Task submitted successfully",
      data: { id: docRef.id, ...submission, submitToRoleIds, appealToRoleIds },
    });
  } catch (error) {
    console.error("submitTask error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error submitting task",
    });
  }
};

// Get my submissions
export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const { formId, criteriaId } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    console.log("Fetching submissions for userId:", userId);

    let query = db.collection("submissions").where("userId", "==", userId);

    if (formId) query = query.where("formId", "==", formId);
    if (criteriaId) query = query.where("criteriaId", "==", criteriaId);

    const snapshot = await query.get();

    // Map all documents with complete field data
    const submissions = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Return complete document with all fields
      return {
        id: doc.id,
        formId: data.formId || null,
        formTitle: data.formTitle || null,
        criteriaId: data.criteriaId || null,
        criteriaName: data.criteriaName || null,
        taskId: data.taskId || null,
        taskName: data.taskName || null,
        moduleId: data.moduleId || null,
        moduleName: data.moduleName || null,
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        userName: data.userName || null,
        userRole: data.userRole || null,
        college: data.college || null,
        department: data.department || null,
        claimedScore: data.claimedScore || null,
        evidence: data.evidence || null,
        description: data.description || null,
        maxMarks: data.maxMarks || null,
        reviewerScore: data.reviewerScore || null,
        reviewerReason: data.reviewerReason || null,
        reviewerId: data.reviewerId || null,
        reviewerRole: data.reviewerRole || null,
        isAppealed: data.isAppealed || false,
        appealReason: data.appealReason || null,
        appealRequestedScore: data.appealRequestedScore || null,
        appealerScore: data.appealerScore || null,
        appealerReason: data.appealerReason || null,
        appealerId: data.appealerId || null,
        appealerRole: data.appealerRole || null,
        status: data.status || "pending",
        finalScore: data.finalScore || null,
        submitToRoleIds: data.submitToRoleIds || [],
        appealToRoleIds: data.appealToRoleIds || [],
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    });

    console.log(`Found ${submissions.length} submissions for user ${userId}`);
    console.log("Submissions data:", JSON.stringify(submissions, null, 2));

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("getMySubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching submissions",
    });
  }
};

// Get review queue (HOD/Committee)
export const getReviewQueue = async (req, res) => {
  try {
    const userRole = (
      req.user?.role ||
      req.headers["x-user-role"] ||
      ""
    ).toLowerCase();
    const college = req.user?.college || req.headers["x-college"];
    const department = req.user?.department || req.headers["x-department"];

    if (!userRole) {
      return res
        .status(401)
        .json({ success: false, message: "User role not found" });
    }

    let query = db
      .collection("submissions")
      .where("status", "==", "submitted")
      .where("submitToRoleIds", "array-contains", userRole);

    if (college) query = query.where("college", "==", college);
    if (department) query = query.where("department", "==", department);

    const snapshot = await query.get();
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `getReviewQueue: Found ${submissions.length} submissions for role ${userRole}, college ${college}, department ${department}`,
    );
    console.log(
      "Submission IDs:",
      submissions.map((s) => s.id),
    );

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("getReviewQueue error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching review queue",
    });
  }
};

// Get reviewed submissions (HOD/Committee)
export const getReviewedSubmissions = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const userRole = (
      req.user?.role ||
      req.headers["x-user-role"] ||
      ""
    ).toLowerCase();
    const college = req.user?.college || req.headers["x-college"];
    const department = req.user?.department || req.headers["x-department"];

    if (!userId || !userRole) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Fetch all submissions reviewed by this user (regardless of current status)
    let query = db.collection("submissions").where("reviewerId", "==", userId);

    if (college) query = query.where("college", "==", college);
    if (department) query = query.where("department", "==", department);

    const snapshot = await query.get();
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `getReviewedSubmissions: Found ${submissions.length} submissions reviewed by user ${userId}`,
    );
    console.log(
      "Reviewed submission statuses:",
      submissions.map((s) => ({ id: s.id, status: s.status })),
    );

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("getReviewedSubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching reviewed submissions",
    });
  }
};

// Review a submission
export const reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerScore, reviewerReason } = req.body;
    const reviewerId =
      req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const reviewerRole = req.user?.role || req.headers["x-user-role"];

    if (reviewerScore === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Reviewer score required" });
    }

    const docRef = db.collection("submissions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    await docRef.update({
      status: "reviewed",
      reviewerScore: Number(reviewerScore),
      reviewerReason: reviewerReason || "",
      reviewerId: reviewerId || null,
      reviewerRole: reviewerRole || null,
      finalScore: Number(reviewerScore),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Submission reviewed successfully",
    });
  } catch (error) {
    console.error("reviewSubmission error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error reviewing submission",
    });
  }
};

// Raise an appeal
export const raiseAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealReason, appealRequestedScore } = req.body;

    if (!appealReason) {
      return res
        .status(400)
        .json({ success: false, message: "Appeal reason required" });
    }

    const docRef = db.collection("submissions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    const data = doc.data();
    if (data.status !== "reviewed") {
      return res.status(400).json({
        success: false,
        message: "Can only appeal reviewed submissions",
      });
    }

    if (data.isAppealed) {
      return res.status(400).json({
        success: false,
        message: "Appeal already submitted",
      });
    }

    await docRef.update({
      status: "appealed",
      isAppealed: true,
      appealReason,
      appealRequestedScore: appealRequestedScore
        ? Number(appealRequestedScore)
        : data.claimedScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Appeal submitted successfully",
      data: { appealToRoleIds: data.appealToRoleIds || [] },
    });
  } catch (error) {
    console.error("raiseAppeal error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error raising appeal",
    });
  }
};

// Accept review (Faculty accepts reviewer's score)
export const acceptReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid || req.user?.id || req.headers["x-user-id"];

    const docRef = db.collection("submissions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    const data = doc.data();

    // Verify this is the user's submission
    if (data.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (data.status !== "reviewed") {
      return res.status(400).json({
        success: false,
        message: "Can only accept reviewed submissions",
      });
    }

    await docRef.update({
      status: "accepted",
      finalScore: data.reviewerScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's total score in users collection
    if (
      userId &&
      data.reviewerScore !== null &&
      data.reviewerScore !== undefined
    ) {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        totalScore: admin.firestore.FieldValue.increment(data.reviewerScore),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review accepted successfully",
    });
  } catch (error) {
    console.error("acceptReview error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error accepting review",
    });
  }
};

// Get appeal queue
export const getAppealQueue = async (req, res) => {
  try {
    const userRole = (
      req.user?.role ||
      req.headers["x-user-role"] ||
      ""
    ).toLowerCase();
    const college = req.user?.college || req.headers["x-college"];
    const department = req.user?.department || req.headers["x-department"];

    console.log(
      `[getAppealQueue] User role: ${userRole}, College: ${college}, Department: ${department}`,
    );

    if (!userRole) {
      return res
        .status(401)
        .json({ success: false, message: "User role not found" });
    }

    let query = db
      .collection("submissions")
      .where("status", "==", "appealed")
      .where("appealToRoleIds", "array-contains", userRole);

    if (college) query = query.where("college", "==", college);
    if (department) query = query.where("department", "==", department);

    const snapshot = await query.get();
    const appeals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `[getAppealQueue] Found ${appeals.length} appeals for role: ${userRole}`,
    );
    if (appeals.length > 0) {
      console.log(
        `[getAppealQueue] First appeal appealToRoleIds:`,
        appeals[0].appealToRoleIds,
      );
    }

    return res.status(200).json({
      success: true,
      data: appeals,
    });
  } catch (error) {
    console.error("getAppealQueue error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching appeal queue",
    });
  }
};

// Review an appeal
export const reviewAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealerScore, appealerReason } = req.body;
    const appealerId =
      req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const appealerRole = req.user?.role || req.headers["x-user-role"];

    if (appealerScore === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Appealer score required" });
    }

    const docRef = db.collection("submissions").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Appeal not found" });
    }

    await docRef.update({
      status: "appeal-resolved",
      appealerScore: Number(appealerScore),
      appealerReason: appealerReason || "",
      appealerId: appealerId || null,
      appealerRole: appealerRole || null,
      finalScore: Number(appealerScore),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's total score in users collection
    const submissionData = doc.data();
    const facultyUserId = submissionData.userId;
    if (
      facultyUserId &&
      appealerScore !== null &&
      appealerScore !== undefined
    ) {
      const userRef = db.collection("users").doc(facultyUserId);
      await userRef.update({
        totalScore: admin.firestore.FieldValue.increment(Number(appealerScore)),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appeal reviewed successfully",
    });
  } catch (error) {
    console.error("reviewAppeal error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error reviewing appeal",
    });
  }
};

// Get appeals resolved by the current appealer
export const getResolvedAppeals = async (req, res) => {
  try {
    const appealerId =
      req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const college = req.user?.college || req.headers["x-college"];
    const department = req.user?.department || req.headers["x-department"];

    console.log(
      `[getResolvedAppeals] Appealer ID: ${appealerId}, College: ${college}, Department: ${department}`,
    );

    if (!appealerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    let query = db
      .collection("submissions")
      .where("appealerId", "==", appealerId);

    if (college) query = query.where("college", "==", college);
    if (department) query = query.where("department", "==", department);

    const snapshot = await query.get();
    const resolved = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      `[getResolvedAppeals] Found ${resolved.length} resolved appeals for appealer: ${appealerId}`,
    );

    return res.status(200).json({
      success: true,
      data: resolved,
    });
  } catch (error) {
    console.error("getResolvedAppeals error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching resolved appeals",
    });
  }
};

// Get user total score
export const getUserTotal = async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || req.headers["x-user-id"];
    const { formId } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    let query = db
      .collection("submissions")
      .where("userId", "==", userId)
      .where("status", "in", ["reviewed", "appeal-resolved"]);

    if (formId) query = query.where("formId", "==", formId);

    const snapshot = await query.get();
    let totalScore = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalScore += Number(data.finalScore || 0);
    });

    return res.status(200).json({
      success: true,
      data: { totalScore, submissionCount: snapshot.size },
    });
  } catch (error) {
    console.error("getUserTotal error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error calculating total score",
    });
  }
};
