import admin from 'firebase-admin';

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error('Firebase environment variables are missing');
  process.exit(1);
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  console.log('FIREBASE CONNECTED SUCCESSFULLY');
} catch (error) {
  console.error('FIREBASE CONNECTION FAILED');
  console.error(error);
  process.exit(1);
}

export const auth = admin.auth();
export const db = admin.firestore();
