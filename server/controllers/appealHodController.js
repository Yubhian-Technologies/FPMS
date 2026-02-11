import { db } from "../config/firebase.js";

// Submit a new HOD appeal
export const submitHodAppeal = async (req, res) => {
  try {
    const { subId, criterionName, module } = req.params; // module can be dynamic
    const { requestedScore, hodReason, evidence } = req.body;
    const hodId = req.hod.id;

    if (!requestedScore || !hodReason) {
      return res.status(400).json({ success: false, message: "Requested score and reason are required" });
    }

    // Fetch HOD submission (module1)
    const hodRef = db.collection(`${module}_hod`).doc(hodId);
    const hodSnap = await hodRef.get();

    if (!hodSnap.exists) {
      return res.status(404).json({ success: false, message: "HOD submission not found" });
    }

    const subsections = hodSnap.data().subsections || [];
    const subsection = subsections.find(s => s.id === subId);
    if (!subsection) return res.status(404).json({ success: false, message: "Subsection not found" });

    const criterion = subsection.criteria.find(c => c.name === criterionName);
    if (!criterion) return res.status(404).json({ success: false, message: "Criterion not found" });

    // Check duplicate appeal
    const existing = await db.collection("appeals-hod")
      .where("type", "==", "hod")
      .where("hodId", "==", hodId)
      .where("module", "==", module)
      .where("subId", "==", subId)
      .where("criterionName", "==", criterionName)
      .get();

    if (!existing.empty) return res.status(400).json({ success: false, message: "Appeal already submitted" });

    await db.collection("appeals-hod").add({
      module,
      subId,
      criterionName,
      type: "hod",
      hodId,
      requestedScore,
      hodReason,
      evidence: evidence || "",
      status: "pending",
      createdAt: new Date(),
      claimedScore: criterion.claimedScore || 0,
      hodScore: criterion.hodScore || null,
      adminScore: criterion.adminScore || null,
    });

    return res.status(200).json({ success: true, message: "HOD appeal submitted successfully" });

  } catch (error) {
    console.error("Submit HOD Appeal Error:", error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const fetchHodAppeals = async (req, res) => {
  try {
    const hodId = req.hod?.id;

    if (!hodId) {
      return res.status(400).json({ success: false, message: "HOD ID not found in request" });
    }

    // 🔹 Fetch all appeals for this HOD (no orderBy to avoid index issue)
    const snapshot = await db.collection("appeals-hod")
      .where("type", "==", "hod")
      .where("hodId", "==", hodId)
      .get();

    // Map to JSON
    let appeals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort in memory by createdAt descending
    appeals.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

    return res.status(200).json({ success: true, data: appeals });

  } catch (error) {
    console.error("Fetch HOD Appeals Error:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: error.message.includes("requires an index")
        ? error.message + " — You need to create a composite index in Firebase console."
        : error.message
    });
  }
};