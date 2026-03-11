import admin from 'firebase-admin';

// Check if environment variable exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("FIREBASE_SERVICE_ACCOUNT is missing in environment variables");
  process.exit(1);
}

let serviceAccount;

try {
  // Parse Firebase credentials from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  // Initialize Firebase only once
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  console.log("FIREBASE CONNECTED SUCCESSFULLY");

} catch (error) {
  console.error("FIREBASE CONNECTION FAILED");
  console.error(error);
  process.exit(1);
}

// Export Firebase services
export const auth = admin.auth();
export const db = admin.firestore();
