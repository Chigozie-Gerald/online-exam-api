var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

// var date = new Date();
let studentOptions = {
  toJSON: {
    virtuals: true,
  },
};

var studentSchema = new Schema(
  {
    firstname: { type: String, trim: true },
    lastname: { type: String, trim: true },
    middlename: { type: String, trim: true },
    nickname: { type: String, trim: true, default: null },
    profilePic: { type: String, trim: true, default: "pic" },
    quizMateNotification: [
      {
        _id: false,
        read: { type: Boolean, default: false },
        msg: { type: String, trim: true },
        email: { type: String, trim: true },
        photo: { type: String, trim: true },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    examNotification: [
      {
        _id: false,
        msg: { type: String, trim: true },
        exam_id: { type: ObjectId, ref: "Exam" },
        read: { type: Boolean, default: false },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    groupNotification: [
      {
        _id: false,
        msg: { type: String, trim: true },
        read: { type: Boolean, default: false },
        group_id: { type: ObjectId, ref: "Group" },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    defaultPic: { type: String, trim: true, default: "pic" },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    group: [
      {
        _id: false,
        name_id: { type: ObjectId, ref: "Group" },
        name: { type: String, trim: true },
        visibility: { type: Boolean, default: null },
        private: { type: Boolean, default: null },
      },
    ],
    block: [
      {
        _id: false,
        email: { type: String },
      },
    ],
    sentQuizMate: [
      {
        _id: false,
        read: { type: Boolean, default: false },
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        photo: { type: String, trim: true },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    quizMateInvites: [
      {
        _id: false,
        read: { type: Boolean, default: false },
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        photo: { type: String, trim: true },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    groupInvites: [
      {
        _id: false,
        msg: { type: String, trim: true },
        read: { type: Boolean, default: false },
        sender_email: { type: String, trim: true },
        group_id: { type: ObjectId, ref: "Group" },
        createdAt: {
          type: Number,
          trim: true,
        },
      },
    ],
    examInvites: [
      {
        _id: false,
        msg: { type: String, trim: true },
        read: { type: Boolean, default: false },
        sender_email: { type: String, trim: true },
        exam_id: { type: ObjectId, ref: "Exam" },
        group_id: { type: ObjectId, ref: "Group" },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    quizMate: [
      {
        _id: false,
        photo: { type: String, trim: true },
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        id: { type: ObjectId, ref: "Student" },
        createdAt: {
          type: Number,
          trim: true,
          default: null,
        },
      },
    ],
    examScore: [
      {
        _id: false,
        id: { type: ObjectId, ref: "Exam" },
        failed: [
          {
            _id: false,
            question: { type: String },
            option: { type: String },
          },
        ],
        name: { type: String, trim: true },
        participant: { type: String, trim: true },
        score: { type: Number, default: 0 },
        position: { type: Number, default: null },
        createdAt: { type: Number, default: null },
      },
    ],
    password: { type: String },
    category: { type: String, trim: true },
    exam: [{ type: ObjectId, ref: "Exam" }],
    registeredCourses: [
      {
        _id: false,
        name: { type: String, trim: true },
      },
    ],
    level: { type: Number, trim: true },
    institution: { type: String, trim: true },
    regNumber: { type: String, trim: true },
    no_access: { type: Boolean, trim: true, default: false },
  },
  studentOptions
);

let studentSchemaVirtual = studentSchema.virtual("fullname");

studentSchemaVirtual.get(function () {
  return this.lastname + " " + this.firstname;
});

studentSchemaVirtual.set(() => {
  let split = fullname.split(" ");
  this.lastname = split[0];
  this.firstname = split[1];
});

module.exports = mongoose.model("Student", studentSchema);

// notifcation when someone creates an exam or when groups change their details... basically anything that involves general iteration
// update controllers
//  exam path in students is for created exams
