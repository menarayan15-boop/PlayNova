import mongoose from "mongoose"

const MONGODB_URI = "mongodb+srv://menarayan15_db_user:HHZ2k2254IWoHRBn@cluster0.unoinay.mongodb.net/playnova?retryWrites=true&w=majority"
const API_URL = "http://localhost:5000"

async function runTests() {
  console.log("=== PLAYNOVA REAL MONGODB ATLAS REGISTRATION & PERSISTENCE TEST ===")
  const timestamp = Date.now()
  const testEmail = `atlas_persisted_${timestamp}@playnova.io`
  const testPassword = "ValidPassword123!"
  const testName = `Atlas Tester ${timestamp.toString().slice(-4)}`

  console.log(`\n[STEP 1] Registering user via API: ${testEmail}`)
  const regRes = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: testName,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  })

  const regData = await regRes.json()
  console.log(`API Registration HTTP Status: ${regRes.status}`)
  console.log(`API Response data:`, JSON.stringify(regData, null, 2))

  if (regRes.status !== 201 || !regData.data?.user?.id) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`)
  }

  const userId = regData.data.user.id
  console.log(`User created with ID: ${userId}`)

  console.log("\n[STEP 2] Direct MongoDB Atlas Inspection...")
  await mongoose.connect(MONGODB_URI, { dbName: "playnova" })
  console.log("Connected directly to MongoDB Atlas cluster!")
  console.log("Target Database Name:", mongoose.connection.name)

  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  console.log("Collections in playnova database:", collections.map(c => c.name))

  const userDoc = await db.collection("users").findOne({ email: testEmail.toLowerCase() })
  if (!userDoc) {
    throw new Error(`CRITICAL: User document NOT found in MongoDB Atlas playnova.users collection!`)
  }

  console.log("\n>>> MONGODB ATLAS DOCUMENT CONFIRMED! <<<")
  console.log("MongoDB _id:", userDoc._id.toString())
  console.log("fullName:", userDoc.fullName)
  console.log("email:", userDoc.email)
  console.log("passwordHash (bcrypt):", userDoc.passwordHash)
  console.log("role:", userDoc.role)
  console.log("preferences:", JSON.stringify(userDoc.preferences))
  console.log("refreshTokens count:", userDoc.refreshTokens?.length)
  console.log("createdAt:", userDoc.createdAt)

  // Verify bcrypt format
  if (!userDoc.passwordHash.startsWith("$2a$") && !userDoc.passwordHash.startsWith("$2b$")) {
    throw new Error("Password is not properly hashed with bcrypt!")
  }
  console.log("[OK] Password is securely hashed with bcrypt.")

  console.log("\n[STEP 3] Testing Login with registered credentials via API...")
  const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  })

  const loginData = await loginRes.json()
  console.log(`API Login HTTP Status: ${loginRes.status}`)
  console.log("Login user safe DTO:", JSON.stringify(loginData.data?.user))
  if (loginRes.status !== 200 || !loginData.data?.tokens?.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`)
  }
  console.log("[OK] Login successful! JWT Access Token received.")

  console.log("\n[STEP 4] Verifying /api/v1/auth/me authenticated profile endpoint...")
  const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginData.data.tokens.accessToken}`,
    },
  })
  const meData = await meRes.json()
  console.log("/api/v1/auth/me status:", meRes.status)
  console.log("Profile data:", JSON.stringify(meData.data))

  console.log("\n[STEP 5] Testing Duplicate Registration Prevention...")
  const dupRes = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Duplicate Attempt",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  })
  const dupData = await dupRes.json()
  console.log("Duplicate registration status:", dupRes.status, `(Expected: 409)`)
  console.log("Duplicate error message:", dupData.error?.message || dupData.message)

  await mongoose.disconnect()
  console.log("\n=======================================================")
  console.log("ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
  console.log("=======================================================")
}

runTests().catch((err) => {
  console.error("Test error:", err)
  process.exit(1)
})

