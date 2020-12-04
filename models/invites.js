let mongoose = require("mongoose");
let ObjectId = mongoose.Schema.Types.ObjectId;
let Schema = mongoose.Schema;

inviteSchema = new Schema({
  read: { type: Boolean, default: false },
  type: { type: String, trim: true },
  msg: { type: String, trim: true },
  id: [{ type: ObjectId, trim: true }],
  createdAt: {
    type: Number,
    trim: true,
    default: Date.now
  }
});

module.exports = mongoose.model("Invite", inviteSchema);
