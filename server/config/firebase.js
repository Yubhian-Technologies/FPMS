import admin from 'firebase-admin';

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("FIREBASE CONNECTED SUCCESSFULLY");
} catch (error) {
  console.error("FIREBASE CONNECTION FAILED");
  console.error(error);
}

export const auth = admin.auth();
export const db = admin.firestore();      