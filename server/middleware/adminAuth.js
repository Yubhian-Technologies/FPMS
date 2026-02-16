import jwt from "jsonwebtoken";
import { auth, db } from "../config/firebase.js";

const isPrincipalRole = (value) => {
  const normalized = String(value || "").toLowerCase();
  return (
    normalized === "admin" ||
    normalized === "principle" ||
    normalized === "principal"
  );
};

export const adminAuth = async (req, res, next) => {
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

    if (!isPrincipalRole(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "Principal access only",
      });
    }

    req.admin = decoded;
    return next();
  } catch (error) {
    try {
      const decodedFirebase = await auth.verifyIdToken(token);
      const firebaseRole = decodedFirebase.role || decodedFirebase.claims?.role;
      const isPrincipal =
        isPrincipalRole(firebaseRole) ||
        Boolean(decodedFirebase.principal || decodedFirebase.claims?.principal);

      if (!isPrincipal) {
        return res.status(403).json({
          success: false,
          message: "Principal access only",
        });
      }

      let userDocData = null;
      try {
        const userDoc = await db
          .collection("users")
          .doc(decodedFirebase.uid)
          .get();
        if (userDoc.exists) userDocData = userDoc.data() || null;
      } catch (docError) {}

      req.admin = {
        id: decodedFirebase.uid,
        uid: decodedFirebase.uid,
        email: decodedFirebase.email,
        role: "principle",
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
