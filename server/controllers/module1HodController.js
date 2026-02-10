import { db } from "../config/firebase.js";

/**
 * Submit ONE sub-sub-criteria (example: 1.1.a)
 */
export const submitHodModule1SubCriteria = async (req, res) => {
  try {
    const hodId = req.hod.id;
    const { subId, key } = req.params;

    const {
      claimedScore = 0,
      maxScore = 0,
      evidence = "",
      description = "",
      subsectionName
    } = req.body;

    if (!subId || !key) {
      return res.status(400).json({
        success: false,
        message: "Subsection ID and criteria key are required"
      });
    }

    if (claimedScore < 0 || claimedScore > maxScore) {
      return res.status(400).json({
        success: false,
        message: "Claimed score must be between 0 and max score"
      });
    }

    const ref = db.collection("hod_module1").doc(hodId);
    const doc = await ref.get();

    const data = doc.exists ? doc.data() : {};
    const subsections = data.subsections || {};

    const subsection = subsections[subId] || {
      id: subId,
      name: subsectionName || `Subsection ${subId}`,
      criteria: {}
    };

    const old = subsection.criteria[key];

    // 🔒 Lock verified criteria
    if (old?.isVerified) {
      return res.status(403).json({
        success: false,
        message: `${subId}.${key} is already verified and cannot be edited`
      });
    }

    subsection.criteria[key] = {
      code: `${subId}.${key}`,
      claimedScore: Number(claimedScore),
      maxScore: Number(maxScore),
      evidence,
      description,

      verifiedScore: old?.verifiedScore ?? null,
      verifierRemarks: old?.verifierRemarks ?? "",
      isVerified: false,

      createdAt: old?.createdAt ?? new Date(),
      updatedAt: new Date()
    };

    subsections[subId] = subsection;

    await ref.set({ subsections }, { merge: true });

    return res.status(200).json({
      success: true,
      message: `${subId}.${key} submitted successfully`
    });

  } catch (error) {
    console.error("HOD Module-1 Submit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/**
 * Get all Module-1 data for HoD
 */
export const getAllHodModule1Subsections = async (req, res) => {
  try {
    const hodId = req.hod.id;

    const ref = db.collection("hod_module1").doc(hodId);
    const doc = await ref.get();

    return res.status(200).json({
      success: true,
      data: doc.exists ? doc.data().subsections || {} : {}
    });

  } catch (error) {
    console.error("Get HoD Module-1 Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

