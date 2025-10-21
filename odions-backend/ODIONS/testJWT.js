// testJWT.js
const API_URL = "http://localhost:5000/api/chatbots/sessions";
const TOKEN = "PASTE_YOUR_JWT_HERE"; // <-- your real JWT

(async () => {
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${TOKEN}`
      }
    });

    const data = await res.json();
    console.log("Response from backend:", data);

    if (res.status === 200) {
      console.log("✅ JWT is valid and backend works!");
    } else {
      console.log(`❌ JWT invalid or backend returned ${res.status}`);
    }
  } catch (err) {
    console.error("Error connecting to backend:", err);
  }
})();
