import { db } from "../config/firebase.js";

export const deanSubmitSubsection = async (req, res) => {
  try {
    const { deanId, subId } = req.params;
    const { criteria, subsectionName } = req.body;

    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Criteria is required",
      });
    }

    if (req.dean.id !== deanId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ref = db.collection("module1_dean").doc(deanId);
    const snap = await ref.get();

    let subsections = snap.exists ? snap.data().subsections || [] : [];
    const subIndex = subsections.findIndex((s) => s.id === subId);

    const criteriaMap = {};

    if (subIndex > -1) {
      (subsections[subIndex].criteria || []).forEach((c) => {
        criteriaMap[c.name] = c;
      });
    }

    criteria.forEach((c) => {
      const old = criteriaMap[c.name];

      if (old?.isVerified) return;

      criteriaMap[c.name] = {
        name: c.name,
        claimedScore: Number(c.claimedScore) || 0,
        maxScore: Number(c.maxScore) || 0,
        evidence: c.evidence || "",
        deanDescription: c.description || "",
        adminScore: old?.adminScore ?? null,
        adminDescription: old?.adminDescription ?? "",
        isVerified: false,
      };
    });

    const updatedCriteria = Object.values(criteriaMap);

    const subsectionData = {
      id: subId,
      name: subsectionName || `Subsection ${subId}`,
      maxScore: updatedCriteria.reduce(
        (sum, c) => sum + (c.maxScore || 0),
        0
      ),
      criteria: updatedCriteria,
    };

    if (subIndex > -1) subsections[subIndex] = subsectionData;
    else subsections.push(subsectionData);

    await ref.set({ subsections }, { merge: true });

    res.status(200).json({
      success: true,
      message: "Dean subsection submitted successfully",
    });
  } catch (error) {
    console.error("Dean Submit Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getDeanSubsections = async (req, res) => {
  try {
    const { deanId } = req.params;

    if (req.dean.id !== deanId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const doc = await db.collection("module1_dean").doc(deanId).get();

    res.status(200).json({
      success: true,
      data: doc.exists ? doc.data().subsections || [] : [],
    });
  } catch (error) {
    console.error("Get Dean Subsections Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const adminViewDeanSubmissions = async (req, res) => {
  try {
    const { moduleName } = req.params;

    if (!req.admin || req.admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    const adminCollege = req.admin.college;

    if (!adminCollege) {
      return res.status(400).json({
        success: false,
        message: "Admin college not found in token",
      });
    }

    
    const collectionName = `${moduleName}_dean`;

    const deanSnap = await db
      .collection("deans")
      .where("college", "==", adminCollege)
      .get();

    const results = [];

    for (const deanDoc of deanSnap.docs) {
      const submissionSnap = await db
        .collection(collectionName)
        .doc(deanDoc.id)
        .get();

      if (submissionSnap.exists) {
        results.push({
          deanId: deanDoc.id,
          deanName: deanDoc.data().name,
          college: deanDoc.data().college,
          subsections: submissionSnap.data().subsections || [],
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Admin View Dean Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const adminVerifyDeanCriterion = async (req, res) => {
  try {
    const { moduleName, deanId, subId, criterionName } = req.params;
    const { adminScore, adminDescription } = req.body;

    if (!req.admin || req.admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const collectionName = `${moduleName}_dean`;
    const ref = db.collection(collectionName).doc(deanId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const subsections = snap.data().subsections || [];
    const subsection = subsections.find((s) => s.id === subId);

    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    const criterion = subsection.criteria.find(
      (c) => c.name === criterionName
    );

    if (!criterion) {
      return res.status(404).json({
        success: false,
        message: "Criterion not found",
      });
    }

    if (Number(adminScore) > criterion.maxScore) {
      return res.status(400).json({
        success: false,
        message: `Score cannot exceed ${criterion.maxScore}`,
      });
    }

    criterion.adminScore = Number(adminScore) || 0;
    criterion.adminDescription = adminDescription || "";
    criterion.isVerified = true;

    await ref.update({ subsections });

    res.status(200).json({
      success: true,
      message: "Dean criterion verified successfully",
    });
  } catch (error) {
    console.error("Admin Verify Dean Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};