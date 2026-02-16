import jwt from "jsonwebtoken";
import { auth, db } from "../config/firebase.js";

const isFacultyRole = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized === "faculty" || normalized.startsWith("faculty");
};

export const facultyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!isFacultyRole(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "Faculty access only",
      });
    }

    req.faculty = decoded;
    return next();
  } catch (jwtError) {
    try {
      const decodedFirebase = await auth.verifyIdToken(token);
      const firebaseRole =
        decodedFirebase.role ||
        decodedFirebase.claims?.role ||
        decodedFirebase.token?.role;

      let userDocData = null;
      try {
        const userDoc = await db
          .collection("users")
          .doc(decodedFirebase.uid)
          .get();
        if (userDoc.exists) {
          userDocData = userDoc.data() || null;
        }
      } catch (docError) {}

      const resolvedRole = String(
        firebaseRole || userDocData?.role || "",
      ).trim();

      if (!isFacultyRole(resolvedRole)) {
        return res.status(403).json({
          success: false,
          message: "Faculty access only",
        });
      }

      req.faculty = {
        id: decodedFirebase.uid,
        uid: decodedFirebase.uid,
        email: decodedFirebase.email,
        role: resolvedRole,
        college:
          decodedFirebase.college ||
          decodedFirebase.claims?.college ||
          userDocData?.college,
        department:
          decodedFirebase.department ||
          decodedFirebase.claims?.department ||
          userDocData?.department,
        token: decodedFirebase,
      };

      return next();
    } catch (firebaseError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  }
};
