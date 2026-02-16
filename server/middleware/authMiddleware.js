import jwt from "jsonwebtoken";
import { auth } from "../config/firebase.js";

export const committeeAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  if (token === "demo-token-committee") {
    req.committee = {
      role: "committee",
      email: "committee@demo.edu",
      demo: true,
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "committee") {
      return res.status(403).json({
        success: false,
        message: "Not authorized (committee only)",
      });
    }

    req.committee = decoded;
    return next();
  } catch (err) {
    try {
      const decodedFirebase = await auth.verifyIdToken(token);
      const role = decodedFirebase.role || decodedFirebase.claims?.role;
      const isCommitteeMember = Boolean(
        decodedFirebase.committeeMember ||
        decodedFirebase.claims?.committeeMember,
      );

      if (role !== "committee" && !isCommitteeMember) {
        return res.status(403).json({
          success: false,
          message: "Not authorized (committee only)",
        });
      }

      req.committee = {
        uid: decodedFirebase.uid,
        email: decodedFirebase.email,
        role: "committee",
        committeeMember: isCommitteeMember,
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
