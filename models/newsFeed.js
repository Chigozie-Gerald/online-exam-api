let mongoose = require("mongoose");
let ObjectId = mongoose.Schema.Types.ObjectId;
let Schema = mongoose.Schema;

let newsFeedOptions = {
  toJSON: {
    virtuals: true
  }
};

var newsFeedSchema = new Schema(
  {
    read: { type: Boolean, default: false },
    grouped: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    upd_msg: [
      {
        msg: { type: String, trim: true }
      }
    ],
    group_id: { type: ObjectId, ref: "Group", default: null },
    groupName: { type: String, trim: true },
    creator: { type: String, trim: true },
    creator_id: { type: ObjectId, ref: "Student" },
    feed_id: { type: ObjectId, ref: "Exam" },
    id: [{ type: ObjectId, ref: "Student" }],
    createdAt: {
      type: Number,
      trim: true,
      default: Date.now
    }
  },
  newsFeedOptions
);

let newsFeedVirtual = newsFeedSchema.virtual("msg");

newsFeedVirtual.get(() => {
  if (this.grouped) {
    `created an exam in your group ${this.groupName}`;
  } else {
    `created an exam`;
  }
});

module.exports = mongoose.model("NewsFeed", newsFeedSchema);
