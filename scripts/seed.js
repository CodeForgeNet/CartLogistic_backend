// scripts/seed.js
// Run with: node scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const csv = require("csvtojson");
const path = require("path");
const Driver = require("../models/Driver");
const Order = require("../models/Order");
const Route = require("../models/Route");
const User = require("../models/User");

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  console.log("Dropping existing drivers collection to remove old indexes...");
  try {
    await mongoose.connection.collections.drivers.drop();
    console.log("Drivers collection dropped.");
  } catch (error) {
    if (error.code === 26) {
      console.log("Drivers collection did not exist, skipping drop.");
    } else {
      // For any other error, we should probably stop the script
      throw error;
    }
  }

  console.log("Clearing existing data...");
  await Driver.deleteMany({});
  await Route.deleteMany({});
  await Order.deleteMany({});

  // Check if we have a manager user, create if not
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    console.log("Creating default admin user...");
    await User.create({
      email: "admin@logistics.com",
      password: "admin123", // Will be hashed by the schema pre-save hook
      name: "Mai Admin hu",
      role: "admin",
    });
    console.log("Default admin created");
  }

  console.log("Reading CSV files...");
  // Sample data for testing if CSV files don't exist
  // In a real project, you would have actual CSV files

  // Create data directory if it doesn't exist
  const fs = require("fs");
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Check if CSV files exist, if not create sample ones
  const driversPath = path.join(dataDir, "drivers.csv");
  const routesPath = path.join(dataDir, "routes.csv");
  const ordersPath = path.join(dataDir, "orders.csv");

  if (!fs.existsSync(driversPath)) {
    console.log("Creating sample drivers.csv...");
    fs.writeFileSync(
      driversPath,
      "name,currentShiftHours,past7DayHours,email,isActive\n" +
        "Rahul Singh,2,7|8|6|7|8|6,rahul@example.com,true\n" +
        "Priya Patel,3,8|7|9|8|7|6,priya@example.com,true\n" +
        "Amit Kumar,1,6|7|9|8|6|7,amit@example.com,true\n" +
        "Sneha Gupta,0,5|6|7|6|5|4,sneha@example.com,true\n" +
        "Vikram Sharma,4,8|9|8|7|8|9,vikram@example.com,true\n"
    );
  }

  if (!fs.existsSync(routesPath)) {
    console.log("Creating sample routes.csv...");
    fs.writeFileSync(
      routesPath,
      "routeId,distanceKm,trafficLevel,baseTime\n" +
        "R001,10,Low,30\n" +
        "R002,15,Medium,45\n" +
        "R003,20,High,60\n" +
        "R004,12,Low,35\n" +
        "R005,18,Medium,50\n"
    );
  }

  if (!fs.existsSync(ordersPath)) {
    console.log("Creating sample orders.csv...");
    fs.writeFileSync(
      ordersPath,
      "orderId,value_rs,assigned_route,delivery_timestamp,status\n" +
        "O001,800,R001,,Pending\n" +
        "O002,1200,R002,,Pending\n" +
        "O003,950,R003,,Pending\n" +
        "O004,1500,R004,,Pending\n" +
        "O005,750,R005,,Pending\n" +
        "O006,1100,R001,,Pending\n" +
        "O007,900,R002,,Pending\n"
    );
  }

  const drivers = await csv().fromFile(driversPath);
  const routes = await csv().fromFile(routesPath);
  const orders = await csv().fromFile(ordersPath);

  console.log("Inserting data into MongoDB...");

  // Ensure numeric fields converted
  await Driver.insertMany(
    drivers.map((d) => ({
      name: d.name,
      currentShiftHours: Number(d.shift_hours || 0),
      past7DayHours: (d.past_week_hours || "")
        .split("|")
        .filter(Boolean)
        .map(Number),
      email: d.email,
      // isActive: d.isActive === "true", // Removed this line
    }))
  );

  await Route.insertMany(
    routes.map((r) => ({
      routeId: r.route_id,
      distanceKm: Number(r.distance_km),
      trafficLevel: r.traffic_level,
      baseTimeMinutes: Number(r.base_time_min),
    }))
  );

  await Order.insertMany(
    orders.map((o) => {
      let deliveryTimestamp = null;
      if (o.delivery_time) {
        const today = new Date();
        const [hours, minutes] = o.delivery_time.split(":").map(Number);
        // Set the time from the CSV on today's date
        today.setHours(hours, minutes, 0, 0);
        deliveryTimestamp = today;
      }
      return {
        orderId: o.order_id,
        valueRs: Number(o.value_rs),
        assignedRouteId: o.route_id,
        deliveryTimestamp: deliveryTimestamp,
        status: o.status || "Pending",
      };
    })
  );

  console.log("Seed complete");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
