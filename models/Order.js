const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  valueRs: { type: Number, required: true },
  assignedRouteId: { type: String, required: true },
  deliveryTimestamp: { type: Date },
  status: { type: String, enum: ['Pending', 'Delivered'], default: 'Pending' }
});

module.exports = mongoose.model('Order', orderSchema);