const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  currentShiftHours: { type: Number, default: 0 },
  past7DayHours: { type: [Number], default: [] },
  email: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Driver', driverSchema);