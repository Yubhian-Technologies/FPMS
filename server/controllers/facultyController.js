import bcrypt from "bcryptjs";
import { db } from "../config/firebase.js";

export const facultyLogin = async (req, res) => {
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

    const facultyDoc = snapshot.docs[0];
    const facultyData = facultyDoc.data();

    const normalizedRole = String(facultyData.role || "")
      .trim()
      .toLowerCase();
    if (
      !(normalizedRole === "faculty" || normalizedRole.startsWith("faculty"))
    ) {
      return res.status(403).json({
        success: false,
        message: "Faculty access only",
      });
    }

    if (facultyData.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Faculty account is inactive",
      });
    }

    const isMatch = await bcrypt.compare(password, facultyData.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Faculty login successful",
      user: {
        id: facultyDoc.id,
        name: facultyData.name,
        email: facultyData.email,
        role: "faculty",
        department: facultyData.department,
        designation: facultyData.designation,
      },
    });
  } catch (error) {
    console.error("Faculty login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
