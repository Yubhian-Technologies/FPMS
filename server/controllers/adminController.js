import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const snapshot = await db
      .collection('admins')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    const isMatch = await bcrypt.compare(
      password,             
      adminData.password      
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: adminDoc.id,
        role: 'admin',
        email: adminData.email,
        college: adminData.college 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: adminDoc.id,
        name: adminData.name,
        email: adminData.email,
        college: adminData.college,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const addHod = async (req, res) => {
  try {
    const { name, email, password, department, college, hasPhd } = req.body;

    if (!name || !email || !password || !department || !college) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingHod = await db
      .collection('hods')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingHod.empty) {
      return res.status(409).json({
        success: false,
        message: 'HOD already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('hods').add({
      name,
      email,
      password: hashedPassword,
      department,
      college,
      hasPhd: Boolean(hasPhd),
      role: 'hod',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      message: 'HOD added successfully'
    });

  } catch (error) {
    console.error('Add HOD error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
export const addDean = async (req, res) => {
  try {
    const { name, email, password, department, college, hasPhd } = req.body;

    if (!name || !email || !password || !department || !college) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingHod = await db
      .collection('deans')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingHod.empty) {
      return res.status(409).json({
        success: false,
        message: 'DEAN already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('deans').add({
      name,
      email,
      password: hashedPassword,
      department,
      college,
      hasPhd: Boolean(hasPhd),
      role: 'dean',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      message: 'Dean added successfully'
    });

  } catch (error) {
    console.error('Add Dean error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllHods = async (req, res) => {
  try {
    const snapshot = await db.collection('hods').get();

    const hods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      data: hods
    });
  } catch (error) {
    console.error('Get HODs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllDeans = async (req, res) => {
  try {
    const snapshot = await db.collection('deans').get();

    const deans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      data: deans
    });
  } catch (error) {
    console.error('Get DEANS error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const updateHod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department, college, hasPhd } = req.body;

    const hodRef = db.collection('hods').doc(id);
    const hodDoc = await hodRef.get();

    if (!hodDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'HOD not found'
      });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (college) updateData.college = college;
    if (hasPhd !== undefined) updateData.hasPhd = Boolean(hasPhd);

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await hodRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'HOD updated successfully'
    });

  } catch (error) {
    console.error('Update HOD error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
export const updateDean = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department, college, hasPhd } = req.body;

    const deanRef = db.collection('deans').doc(id);
    const deanDoc = await deanRef.get();

    if (!deanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Dean not found'
      });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (college) updateData.college = college;
    if (hasPhd !== undefined) updateData.hasPhd = Boolean(hasPhd);

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await deanRef.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Dean updated successfully'
    });

  } catch (error) {
    console.error('Update Dean error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const deleteHod = async (req, res) => {
  try {
    const { id } = req.params;

    const hodRef = db.collection('hods').doc(id);
    const hodDoc = await hodRef.get();

    if (!hodDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'HOD not found'
      });
    }

    await hodRef.delete();

    return res.status(200).json({
      success: true,
      message: 'HOD deleted successfully'
    });

  } catch (error) {
    console.error('Delete HOD error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const deleteDean = async (req, res) => {
  try {
    const { id } = req.params;

    const deanRef = db.collection('deans').doc(id);
    const deanDoc = await deanRef.get();

    if (!deanDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'dean not found'
      });
    }

    await deanRef.delete();

    return res.status(200).json({
      success: true,
      message: 'dean deleted successfully'
    });

  } catch (error) {
    console.error('Delete dean error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};