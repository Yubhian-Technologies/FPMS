import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db} from '../config/firebase.js';
import admin from 'firebase-admin';

export const committeeLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (email !== process.env.COMMITTEE_EMAIL) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const isMatch = await bcrypt.compare(password, process.env.COMMITTEE_PASSWORD);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const payload = {
    role: 'committee',
    email,
    type: 'committee'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });

  return res.json({
    success: true,
    message: 'Committee login successful',
    token,
    user: {
      email,
      role: 'committee',
      name: 'Committee Member'
    }
  });
};



export const addAdmin = async (req, res) => {
  try {
    const { name, email, password, college, experience, hasPhd } = req.body;

    if (!name || !email || !password || !college || experience === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingAdmin = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingAdmin.empty) {
      return res.status(409).json({
        success: false,
        message: 'Admin already exists'
      });
    }

   
    const hashedPassword = await bcrypt.hash(password, 10);

   
    await db.collection('admins').add({
      name,
      email,
      password: hashedPassword,
      college,
      experience: Number(experience),
      hasPhd: Boolean(hasPhd),
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      message: 'Admin added successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const getAllAdmins = async (req, res) => {
  try {
    const adminsSnapshot = await db.collection('admins').get();

    const admins = adminsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const adminRef = db.collection('admins').doc(id);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await adminRef.delete();

    return res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, college, experience, hasPhd } = req.body;

    const adminRef = db.collection('admins').doc(id);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (college) updateData.college = college;
    if (experience !== undefined) updateData.experience = Number(experience);
    if (hasPhd !== undefined) updateData.hasPhd = Boolean(hasPhd);

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await adminRef.update(updateData);

    return res.json({
      success: true,
      message: 'Admin updated successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const fetchAppealsForCommittee = async (req, res) => {
  try {
    const snapshot = await db.collection("appeals").get();
    const appeals = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.claimedScore !== undefined && data.hodScore !== undefined) {
        appeals.push({ id: doc.id, ...data });
      }
    });
    return res.status(200).json({ success: true, data: appeals });
  } catch (error) {
    console.error("Fetch Committee Appeals Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyAppealByCommittee = async (req, res) => {
  try {
    const { appealId } = req.params;
    const { committeeScore, committeeRemarks } = req.body;

    if (committeeScore === undefined) {
      return res.status(400).json({
        success: false,
        message: "Committee score is required"
      });
    }

    const ref = db.collection("appeals").doc(appealId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Appeal not found"
      });
    }

    const appealData = doc.data();

    if (appealData.claimedScore === undefined || appealData.hodScore === undefined) {
      return res.status(400).json({
        success: false,
        message: "Appeal cannot be verified: missing faculty or HOD score"
      });
    }

    await ref.update({
      committeeScore,
      committeeRemarks: committeeRemarks || "",
      verifiedByCommittee: true,
      status: "committee_verified",
      committeeVerifiedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Appeal successfully verified by committee"
    });
  } catch (error) {
    console.error("Verify Appeal Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
