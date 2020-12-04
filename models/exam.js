var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var examSchema = new Schema({
  name: { type: String, trim: true },
  grouped: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  addAble: { type: Boolean, default: false },
  group_id: { type: ObjectId, ref: "Group" },
  author: { type: String, trim: true, default: "Examiner" },
  author1_id: [
    {
      _id: false,
      id: { type: ObjectId, ref: "Student" }
    }
  ],
  author_id: { type: ObjectId, ref: "Student" },
  makers: [
    {
      _id: false,
      id: { type: ObjectId, ref: "Student" },
      creator: { type: Boolean, default: false },
      question: { type: Number, trim: true }
    }
  ],
  makers_score: [
    {
      _id: false,
      id: { type: ObjectId, ref: "Student" },
      score: { type: Number, trim: true, default: null }
    }
  ],
  creator: { type: String },
  createdAt: { type: Number, trim: true, default: new Date() },
  category: { type: String, trim: true },
  section: { type: String, trim: true },
  expiresAt: { type: Number, trim: true },
  opensAt: { type: Number, trim: true },
  writers: [
    {
      _id: false,
      id: { type: ObjectId, ref: "Student" },
      score: { type: Number, trim: true, default: null },
      position: { type: Number, trim: true }
    }
  ],
  interest: [
    {
      _id: false,
      id: { type: ObjectId, ref: "Student" }
    }
  ],
  count: { type: Number, trim: true, default: 0 },
  max_count: { type: Number, trim: true, default: 1000 },
  max_question: { type: Number, trim: true, default: 1000 },
  question: [
    {
      text: { type: String, trim: true },
      pic: { type: String, trim: true, default: null },
      options: [
        {
          name: { type: String, trim: true },
          correct: { type: Boolean, default: false }
        }
      ],
      explanation: { type: String, trim: true, default: null },
      owner: { type: String, default: null }
    }
  ],
  duration: { type: Number, trim: true, default: 60 },
  avg_duration: { type: Number, trim: true, default: null }
});

module.exports = mongoose.model("Exam", examSchema);
