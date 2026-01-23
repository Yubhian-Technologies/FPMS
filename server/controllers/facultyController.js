import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';

export const facultyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const snapshot = await db
      .collection('faculty')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const facultyDoc = snapshot.docs[0];
    const facultyData = facultyDoc.data();

    if (facultyData.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Faculty account is inactive'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      facultyData.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: facultyDoc.id,
        role: 'faculty',
        email: facultyData.email,
        department: facultyData.department
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Faculty login successful',
      token,
      user: {
        id: facultyDoc.id,
        name: facultyData.name,
        email: facultyData.email,
        role: 'faculty',
        department: facultyData.department,
        designation: facultyData.designation
      }
    });

  } catch (error) {
    console.error('Faculty login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
