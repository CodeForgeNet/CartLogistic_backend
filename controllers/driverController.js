// /Users/karansingh/Desktop/GreenCart Logistics/backend/controllers/driverController.js
const Driver = require("../models/Driver");
const Joi = require("joi");

// Validation schema
const driverSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().allow(""),
  currentShiftHours: Joi.number().min(0),
  past7DayHours: Joi.array().items(Joi.number().min(0)),
  isActive: Joi.boolean(),
});

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ _id: -1 }); // Sort by _id in descending order
    res.json(drivers);
  } catch (err) {
    console.error("Get drivers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get driver by ID
// @route   GET /api/drivers/:id
// @access  Private
exports.getDriverById = async (req, res) => {
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
};

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private
exports.createDriver = async (req, res) => {
  try {
    // Validate input
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
};

// @desc    Update a driver
// @route   PUT /api/drivers/:id
// @access  Private
exports.updateDriver = async (req, res) => {
  try {
    // Validate input
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
};

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
// @access  Private
exports.deleteDriver = async (req, res) => {
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
};
