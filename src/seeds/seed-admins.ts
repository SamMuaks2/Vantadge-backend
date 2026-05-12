import mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "vantadge";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env — cannot proceed");
  process.exit(1);
}

console.log("📦 Using DB URI:", MONGODB_URI.replace(/:\/\/.*@/, "://<credentials>@"));
console.log("📦 Using DB name:", MONGODB_DB_NAME);

const AdminUserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    adminRole: {
      type: String,
      enum: ["admin", "finance", "pa", "trainer", "communications"],
    },
    suspended: { type: Boolean, default: false },
    firebaseUid: String,
    lastLogin: Date,
  },
  { timestamps: true }
);

const AdminUser = mongoose.model("AdminUser", AdminUserSchema);

const admins = [
  {
    name: "Debbie",
    email: "debbie@vantadgefitness.com",
    password: "Stronger@2026",
    adminRole: "admin",
  },
  {
    name: "Mohri",
    email: "mohri@vantadgefitness.com",
    password: "Stronger@2026",
    adminRole: "admin",
  },
];

async function seed() {
  console.log("\n🔗 Connecting to MongoDB...");

  // Connect with the SAME dbName the backend uses
  await mongoose.connect(MONGODB_URI!, { dbName: MONGODB_DB_NAME });

  const actualDb = mongoose.connection.db!.databaseName;
  console.log(`✅ Connected — writing to database: "${actualDb}"\n`);

  const collections = await mongoose.connection.db!.listCollections().toArray();
  console.log(
    "📋 Existing collections:",
    collections.map((c) => c.name).join(", ") || "none"
  );
  console.log();

  for (const admin of admins) {
    const normalised = admin.email.toLowerCase();

    // Always upsert so rerunning resets the password
    const hashed = await bcrypt.hash(admin.password, 12);
    const result = await mongoose.connection.db!
      .collection("adminusers")
      .findOneAndUpdate(
        { email: normalised },
        {
          $set: {
            name: admin.name,
            email: normalised,
            password: hashed,
            adminRole: admin.adminRole,
            suspended: false,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, returnDocument: "after" }
      );

    const action = result?.__v === undefined ? "Upserted" : "Updated";
    console.log(`✅ ${action} ${admin.adminRole}: ${normalised}`);
  }

  // Verify
  console.log("\n🔍 Verifying records in database:", actualDb);
  const all = await mongoose.connection.db!
    .collection("adminusers")
    .find({}, { projection: { password: 0 } })
    .toArray();

  if (all.length === 0) {
    console.error("❌ No records found after upsert — something is wrong");
  } else {
    all.forEach((u) =>
      console.log(`   → ${u.email} | role: ${u.adminRole} | suspended: ${u.suspended}`)
    );
  }

  console.log("\n🎉 Done — restart the backend then try logging in");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});