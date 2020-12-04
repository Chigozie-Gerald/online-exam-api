var express = require("express");
var router = express.Router();
var auth = require("../middleware/auth");
var Student = require("../models/student");
var Exam = require("../models/exam");

var register = require("../controllers/register");
var login = require("../controllers/login");
var exam = require("../controllers/exam");
var group = require("../controllers/group");

router.post("/home", register.home);

//Profiles, Register 16
router.post("/register", register.register);
router.post("/profile", register.profile);
router.post("/clear_exam_and_score", register.clearExamAndScore);
router.post("/clear_notification", register.clearNotification);
router.post("/change_profile_pic", register.changeProfilePic);
router.post("/delete_profile_pic", register.deleteProfilePic);
router.post("/send_quiz-mate_invite", register.sendQuizMateInvite);
router.post("/delete_send_quiz-mate_invite", register.deleteSendQuizMateInvite);
router.post("/accept_quiz-mate_invite", register.acceptQuizMateInvite);
router.post("/decline_quiz_mate_invite", register.declineQuizMateInvite);
router.post("/block", register.block);
router.post("/unblock", register.unblock);
router.post("/remove_quiz-mate", register.removeQuizMate);
router.post("/view_quiz-mate", register.viewQuizMate);
router.post("/decline_group_invite", register.declineGroupInvite);
router.post("/decline_exam_invite", register.declineExamInvite);
router.post("/leave_group", register.leaveGroup);
router.post("/choose_successor", register.chooseSuccessor);
router.post("/send_exam_invite", register.sendExamInvite);
router.post("/send_group_invite", register.sendGroupInvite);
router.post("/check", register.check);
router.post("/account_to_private", register.accountToPrivate);
router.post("/get_news_feed", register.getNewsFeed);
router.post("/all_news_feed", register.allNewsFeed);
router.post("/studd", function (req, res) {
  Student.find()
    .then((nf) => {
      nf.forEach((n) => {
        let save = async () => {
          n.examScore = [];
          await n.save();
        };
        save();
      });
      res.send({
        msg: "good",
      });
    })
    .catch((err) => {
      res.status(500).send({
        msg: "Something went wrong",
      });
    });
});
router.post("/stud", function (req, res) {
  Exam.find()
    .then((nf) => {
      nf.forEach((n) => {
        let save = async () => {
          n.makers_score = [];
          n.writers = [];
          n.count = 0;
          await n.save();
        };
        save();
      });
      res.send({
        msg: "good",
      });
    })
    .catch((err) => {
      res.status(500).send({
        msg: "Something went wrong",
      });
    });
});

// Login 1
router.post("/login", login.login);
router.get("/userData", auth, login.userData);

//Exam Routes
//Exam 9
router.get("/exam", exam.exam);
router.get("/get_list", exam.getList);
router.post("/post_exam", exam.postExam);
router.post("/get_exam", exam.getExam);
router.post("/delete_list", exam.deleteList);
router.post("/exam_get", exam.examGet);
router.post("/answer_exam", exam.answerExam);
router.post("/delete_exam", exam.deleteExam);
router.post("/edit_exam_details", exam.editExamDetails);
router.post("/publish", exam.publish);
router.post("/show_interest", exam.showInterest);
router.post("/makers", exam.makers);
router.post("/remove_makers", exam.removeMakers);
//Question 6
router.post("/delete_question", exam.deleteQuestion);
router.post("/update_question", exam.updateQuestion);
router.post("/add_questions", exam.addQuestions);
// router.post("/admin_send_questions", exam.adminSendQuestions);
router.post("/change_pic", exam.changePic);
router.post("/delete_pic", exam.deletePic);
//Option 3
router.post("/delete_option", exam.deleteOption);
router.post("/update_option", exam.updateOption);
router.post("/add_option", exam.addOption);

// Group 8
router.get("/group_get", group.groupGet);
router.post("/create_group", group.createGroup);
router.post("/get_group", group.getGroup);
router.post("/add_members_to_group", group.addMembersToGroup);
router.post("/delete_members_from_group", group.deleteMembersFromGroup);
router.post("/make_admins", group.makeAdmins);
router.post("/remove_admins", group.removeAdmins);
router.post("/join_group", group.joinGroup);
router.post("/accept_request", group.acceptRequest);
router.post("/delete_request", group.deleteRequest);
router.post("/group_details", group.groupDetails);
router.post("/delete_group", group.deleteGroup);
router.post("/change_visibility", group.changeVisibility);
router.post("/change_privacy", group.changePrivacy);

module.exports = router;
