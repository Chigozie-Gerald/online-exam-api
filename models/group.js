var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var groupSchema = new Schema({
  name: { type: String, trim: true },
  visibility: { type: Boolean, trim: true, default: true },
  private: { type: Boolean, trim: true, default: false },
  description: { type: String, trim: true, default: "A group for learning" },
  createdAt: { type: Number, trim: true, default: null },
  num: { type: Number, trim: true, default: 1 },
  creator: { type: ObjectId, ref: "Student" },
  members: [
    {
      _id: false,
      name_id: { type: ObjectId, ref: "Student" },
      name: { type: String, trim: true },
      photo: { type: String, trim: true },
      admin: { type: Boolean, default: false }
    }
  ],
  examNotification: [
    {
      _id: false,
      msg: { type: String, trim: true },
      read: { type: Boolean, default: false },
      createdAt: {
        type: String,
        trim: true,
        default: null
      }
    }
  ],
  requests: [
    {
      _id: false,
      name_id: { type: ObjectId, ref: "Student" },
      name: { type: String, trim: true },
      photo: { type: String, trim: true }
    }
  ]
});

module.exports = mongoose.model("Group", groupSchema);
