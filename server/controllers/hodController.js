import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';


export const hodLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const snapshot = await db
      .collection('hods')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const hodDoc = snapshot.docs[0];
    const hodData = hodDoc.data();

    const isMatch = await bcrypt.compare(
      password,
      hodData.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: hodDoc.id,
        role: 'hod',
        email: hodData.email,
        college: hodData.college,
        department: hodData.department
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'HOD login successful',
      token,
      user: {
        id: hodDoc.id,
        name: hodData.name,
        email: hodData.email,
        role: 'hod',
        department: hodData.department
      }
    });

  } catch (error) {
    console.error('HOD login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const addFaculty = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      college,
      designation,
      experience,
      isActive,
      hasPhd
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !department ||
      !designation ||
      !college ||
      experience === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const existingFaculty = await db
      .collection('faculty')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingFaculty.empty) {
      return res.status(409).json({
        success: false,
        message: 'Faculty already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection('faculty').add({
      name,
      email,
      password: hashedPassword,
      department,
      college,
      designation,
      experience: Number(experience),
      isActive: Boolean(isActive),
      hasPhd: Boolean(hasPhd),
      role: 'faculty',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty added successfully'
    });

  } catch (error) {
    console.error('Add Faculty Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllFaculty = async (req, res) => {
  try {
    const snapshot = await db.collection('faculty').get();

    const facultyList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({ success: true, data: facultyList });
  } catch (error) {
    console.error('Get Faculty Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department,college, designation, experience, isActive, hasPhd } = req.body;

    const facultyRef = db.collection('faculty').doc(id);
    const facultyDoc = await facultyRef.get();

    if (!facultyDoc.exists) return res.status(404).json({ success: false, message: 'Faculty not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (college) updateData.college =college;
    if (designation) updateData.designation = designation;
    if (experience !== undefined) updateData.experience = Number(experience);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (hasPhd !== undefined) updateData.hasPhd = Boolean(hasPhd);
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await facultyRef.update(updateData);

    return res.status(200).json({ success: true, message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Update Faculty Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const facultyRef = db.collection('faculty').doc(id);
    const facultyDoc = await facultyRef.get();

    if (!facultyDoc.exists) return res.status(404).json({ success: false, message: 'Faculty not found' });

    await facultyRef.delete();
    return res.status(200).json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Delete Faculty Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};