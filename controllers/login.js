var Student = require("../models/student");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var config = require("../config/keys");

exports.login = function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(500).send({
      msg: "Please fill in the required field(s)",
    });
  } else
    Student.findOne({ email })
      .then((stud) => {
        if (stud) {
          bcrypt.compare(password, stud.password, (err, isMatch) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong",
              });
              throw err;
            } else if (isMatch) {
              jwt.sign(
                { user: stud._id },
                config.ExamSecretKey,
                { expiresIn: "2h" },
                (err, token) => {
                  if (err) {
                    res.status(500).send({
                      msg: "Something went wrong",
                    });
                  } else if (token) {
                    stud["password"] = null;
                    res.send({
                      user: stud,
                      token,
                    });
                  }
                }
              );
            } else if (!isMatch) {
              res.status(400).send({
                msg: "Password incorrect",
                id: "password",
              });
            }
          });
        } else if (!stud) {
          res.status(401).send({
            msg: "No user with that email exists",
            id: "email",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
        throw err;
      });
};
exports.userData = function (req, res) {
  if (!req.user.user) {
    res.status(404).send({
      msg: "Incomplete info",
    });
  } else {
    Student.findById(req.user.user)
      .select("-password")
      .then((user) => {
        if (user) {
          res.send({ user });
        } else res.status(400).send({ msg: "User is Unavailable" });
      })
      .catch((err) => {
        res.status(400).send({ msg: "User is Unavailable" });
      });
  }
};
