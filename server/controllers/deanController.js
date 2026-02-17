import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";
import admin from "firebase-admin";

export const deanLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const snapshot = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const deanDoc = snapshot.docs[0];
    const deanData = deanDoc.data();

    const normalizedRole = String(deanData.role || "")
      .trim()
      .toLowerCase();
    if (!normalizedRole.startsWith("dean")) {
      return res.status(403).json({
        success: false,
        message: "Dean access only",
      });
    }

    const isMatch = await bcrypt.compare(password, deanData.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dean login successful",
      user: {
        id: deanDoc.id,
        name: deanData.name,
        email: deanData.email,
        role: deanData.role || "dean",
        department: deanData.department,
      },
    });
  } catch (error) {
    console.error("Dean login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
