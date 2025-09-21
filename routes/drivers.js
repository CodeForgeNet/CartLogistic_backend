const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const auth = require("../middleware/auth");
const Joi = require("joi");

const driverSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().allow(""),
  currentShiftHours: Joi.number().min(0),
  past7DayHours: Joi.array().items(Joi.number().min(0)),
  isActive: Joi.boolean(),
});

router.get("/", auth, async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    console.error("Get drivers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  } catch (err) {
    console.error("Get driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { error, value } = driverSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const driver = new Driver(value);
    await driver.save();
    res.status(201).json(driver);
  } catch (err) {
    console.error("Create driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { error, value } = driverSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.details });
    }

    const driver = await Driver.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  } catch (err) {
    console.error("Update driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("Delete driver error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
