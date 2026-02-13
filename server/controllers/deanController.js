import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

export const deanLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const snapshot = await db
      .collection('deans')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const deanDoc = snapshot.docs[0];
    const deanData = deanDoc.data();

    const isMatch = await bcrypt.compare(
      password,
      deanData.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: deanDoc.id,
        role: 'dean',
        email: deanData.email,
        college: deanData.college,
        department: deanData.department
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Dean login successful',
      token,
      user: {
        id: deanDoc.id,
        name: deanData.name,
        email: deanData.email,
        role: 'dean',
        department: deanData.department
      }
    });

  } catch (error) {
    console.error('Dean login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};