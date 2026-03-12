export const signInWithFirebaseEmailPassword = async ({ email, password }) => {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    const error = new Error("Firebase web API key is not configured");
    error.statusCode = 500;
    throw error;
  }

  const firebaseResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
        returnSecureToken: true,
      }),
    },
  );

  const firebaseData = await firebaseResponse.json();

  if (!firebaseResponse.ok || !firebaseData?.idToken) {
    const error = new Error(
      firebaseData?.error?.message || "Invalid email or password",
    );
    error.statusCode = 401;
    throw error;
  }

  return firebaseData.idToken;
};