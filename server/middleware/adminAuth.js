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
  const isDev = process.env.NODE_ENV !== "production";

  // DEV MODE: Use headers instead of Firebase token
  if (isDev) {
    const userId = req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];
    const userName = req.headers["x-user-name"];
    const userRole = req.headers["x-user-role"];
    let userCollege = req.headers["x-college"];
    const userDepartment = req.headers["x-department"];

    if (userId && userEmail && userRole) {
      // If college is empty for a principle, look it up from the admins collection
      if (!userCollege && isPrincipalRole(userRole)) {
        try {
          const snap = await db
            .collection("admins")
            .where("email", "==", String(userEmail).trim().toLowerCase())
            .limit(1)
            .get();
          if (!snap.empty) userCollege = snap.docs[0].data()?.college || "";
        } catch (e) {
          console.error("[adminAuth] DEV college lookup failed:", e.message);
        }
      }

      console.log("[adminAuth] DEV MODE - Using headers. Role:", userRole);
      req.admin = {
        id: userId,
        uid: userId,
        email: userEmail,
        name: userName || userEmail,
        role: userRole,
        college: userCollege,
        department: userDepartment,
      };
      return next();
    }
  }

  // PRODUCTION MODE: Verify Firebase token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

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

    // College lives in "admins" collection, not "users"
    let adminCollege =
      decodedFirebase.college ||
      decodedFirebase.claims?.college ||
      userDocData?.college ||
      "";

    if (!adminCollege) {
      try {
        const adminDoc = await db
          .collection("admins")
          .doc(decodedFirebase.uid)
          .get();
        if (adminDoc.exists) {
          adminCollege = adminDoc.data()?.college || "";
        }
        if (!adminCollege && decodedFirebase.email) {
          const snap = await db
            .collection("admins")
            .where(
              "email",
              "==",
              String(decodedFirebase.email).trim().toLowerCase(),
            )
            .limit(1)
            .get();
          if (!snap.empty) adminCollege = snap.docs[0].data()?.college || "";
        }
      } catch (e) {
        console.error("[adminAuth] PROD college lookup failed:", e.message);
      }
    }

    req.admin = {
      id: decodedFirebase.uid,
      uid: decodedFirebase.uid,
      email: decodedFirebase.email,
      role: "principle",
      college: adminCollege,
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
};
