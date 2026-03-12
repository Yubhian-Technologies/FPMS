import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseCredentials() {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  if (process.env.FIREBASE_CREDENTIALS_PATH) {
    const credentialsPath = path.resolve(
      __dirname,
      '..',
      process.env.FIREBASE_CREDENTIALS_PATH
    );

    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Firebase credentials file not found: ${credentialsPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    return {
      projectId: credentials.project_id,
      clientEmail: credentials.client_email,
      privateKey: credentials.private_key,
    };
  }

  throw new Error(
    'Firebase credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY or provide FIREBASE_CREDENTIALS_PATH.'
  );
}

const firebaseCredentials = loadFirebaseCredentials();

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
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
