var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

examListSchema = new Schema({
  section: { type: String, trim: true },
  list: [
    {
      _id: false,
      name: { type: String, trim: true },
      exams: [{ type: ObjectId, ref: "Exam" }]
    }
  ]
});

module.exports = mongoose.model("Examlist", examListSchema);
