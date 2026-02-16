import { db } from "../config/firebase.js";

export const deanBSubmitSubsection = async (req, res) => {
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

    const ref = db.collection("module1_B_dean").doc(deanId);
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


export const getDeanBSubsections = async (req, res) => {
  try {
    const { deanId } = req.params;

    if (req.dean.id !== deanId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const doc = await db.collection("module1_B_dean").doc(deanId).get();

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