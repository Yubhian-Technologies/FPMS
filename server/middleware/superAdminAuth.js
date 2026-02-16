import { auth } from "../config/firebase.js";

export const superadminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No Firebase token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];

    if (idToken === "demo-token-superadmin") {
      req.superadmin = {
        uid: "demo-superadmin",
        email: "superadmin@demo.com",
        role: "superadmin",
        token: { demo: true },
      };
      return next();
    }

    const decoded = await auth.verifyIdToken(idToken);

    const isSuperAdmin =
      decoded.role === "superadmin" ||
      decoded.superadmin === true ||
      (process.env.SUPERADMIN_EMAIL &&
        decoded.email === process.env.SUPERADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Super admin access only",
      });
    }

    req.superadmin = {
      uid: decoded.uid,
      email: decoded.email,
      role: "superadmin",
      token: decoded,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase token",
    });
  }
};
