var bcrypt = require("bcryptjs");
var Student = require("../models/student");
var Group = require("../models/group");
let NewsFeed = require("../models/newsFeed");
var jwt = require("jsonwebtoken");
var config = require("../config/keys");
var validator = require("validator");
let createdAt = new Date();

// ERROR = res.status(500).send({ msg: "Something went wrong" });

exports.home = function(req, res) {
  res.send("Profile's home");
};

exports.register = function(req, res) {
  const {
    firstname,
    lastname,
    email,
    password,
  } = req.body;

  if (!validator.isEmail(email)) {
    res.status(400).send({
      msg: "Please enter a valid email address"
    });
  }
  // if (
  //   !firstname ||
  //   !lastname ||
  //   !email ||
  //   !password ||
  //   !phone ||
  //   !level ||
  //   !regNumber ||
  //   !category ||
  //   !institution ||
  //   !registeredCourses
  if (
    !firstname ||
    !lastname ||
    !email ||
    !password
  ){
    res.status(400).send({
      msg: "Please fill in the required fields"
    });
  } else {
    Student.findOne({ email })
      .then(stud => {
        if (stud) {
          res.status(401).send({
            msg: "That email is already registered, try another email or Login.",
            id:"email"
          });
        } else if (!stud) {
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) {
                res.status(500).send({
                  msg: "Something went wrong while trying to hash"
                });
                throw err;
              } else if (hash) {
                // var student = new Student({
                //   firstname,
                //   lastname,
                //   middlename,
                //   nickname,
                //   email,
                //   regNumber,
                //   password: hash,
                //   phone,
                //   level,
                //   category,
                //   institution,
                //   registeredCourses
                // });
                var student = new Student({
                  firstname,
                  lastname,
                  email,
                  password: hash,
                });
                student.save((err, saved) => {
                  if (err) {
                    res.status(500).send({
                      msg: "Something went wrong on saving"
                    });
                    throw err;
                  } else {
                    jwt.sign(
                      { user: saved._id },
                      config.ExamSecretKey,
                      { expiresIn: "2h" },
                      (err, token) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong during token generation"
                          });
                        } else if (token) {
                          saved["password"] = null;
                          res.send({
                            user: saved,
                            token
                          });
                        }
                      }
                    );
                  }
                });
              }
            });
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong, caught error"
        });
      });
  }
};

exports.profile = function(req, res) {
  const {
    _id,
    firstname,
    lastname,
    middlename,
    nickname,
    phone,
    email,
    category,
    registeredCourses,
    level,
    institution
  } = req.body;

  if (
    !_id ||
    !firstname ||
    !lastname ||
    !phone ||
    !email ||
    !category ||
    !registeredCourses ||
    !level ||
    !institution
  ) {
    res.status(400).send({
      msg: "Please fill in all required field(s)"
    });
  } else {
    Student.updateOne(
      { _id },
      {
        firstname,
        lastname,
        middlename,
        nickname,
        phone,
        email,
        category,
        registeredCourses,
        level,
        institution
      }
    )
      .then(stud => {
        res.send({
          msg: "Update successful"
        });
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.clearExamAndScore = function(req, res) {
  const { _id } = req.body;
  if (!_id) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Student.updateOne({ _id }, { exam: [], examScore: [] })
      .then(update => {
        res.send({
          msg: "Exam history cleared successfully"
        });
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.clearNotification = function(req, res) {
  const { _id } = req.body;
  if (!_id) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          let daysn = 30 * 24 * 3600 * 1000;
          let days = 0.5 * 24 * 3600 * 1000;
          var now = Date().now;
          const gp_notif = stud.groupNotification.filter(
            g => now - g.createdAt < days
          );
          const ex_notif = stud.examNotification.filter(
            e => now - e.createdAt < days
          );
          const qm_notif = stud.quizMateNotification.filter(
            q => now - q.createdAt < days
          );

          stud.groupNotification = gp_notif;
          stud.examNotification = ex_notif;
          stud.quizMateNotification = qm_notif;
          stud.save((err, saved) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong"
              });
            } else if (saved) {
              res.send({
                msg: "Notification history cleared successfully"
              });
            }
          });
        } else {
          res.status(500).send({
            msg: "The student you provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.changeProfilePic = function(req, res) {
  const { _id, pic } = req.body;
  if (!_id || !pic) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          stud.profilePic = pic;
          stud.save((err, saved) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong"
              });
            } else if (saved) {
              res.send({
                msg: "Profile picture updated successfully"
              });
            }
          });
        } else {
          res.status(404).send({
            msg: "Student not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.deleteProfilePic = function(req, res) {
  const { _id } = req.body;
  if (!_id || !pic) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          stud.profilePic = stud.defaultPic;
          stud.save((err, saved) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong"
              });
            } else if (saved) {
              res.send({
                msg: "Profile picture deleted successfully"
              });
            }
          });
        } else {
          res.status(404).send({
            msg: "Student not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.sendQuizMateInvite = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          if (stud.email == mate) {
            res.status(403).send({
              msg: "You can't invite yourself"
            });
          } else {
            Student.findOne({
              email: { $exists: true, $in: [mate] },
              "block.email": { $ne: stud.email },
              "quizMateInvites.email": { $ne: stud.email },
              "quizMate.email": { $ne: stud.email }
            })
              .then(student => {
                if (student) {
                  stud.sentQuizMate.unshift({
                    name: student.fullname,
                    email: student.email,
                    photo: student.profilePic,
                    createdAt
                  });

                  student.quizMateInvites.unshift({
                    name: stud.fullname,
                    email: stud.email,
                    photo: stud.profilePic,
                    createdAt
                  });

                  student.save((err, savedStud) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (savedStud) {
                      stud.save((err, saved) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        } else if (saved) {
                          res.send({
                            msg: `You've suucessfully sent a quiz-mate invite to ${student.fullname}`
                          });
                        }
                      });
                    }
                  });
                } else {
                  res.status(404).send({
                    msg: "You can't send a request to that Student"
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          }
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.deleteSendQuizMateInvite = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({
      _id,
      "sentQuizMate.email": mate
    })
      .then(stud => {
        if (stud) {
          if (stud.email == mate) {
            res.status(403).send({
              msg: "You couldn't have invited yourself"
            });
          } else {
            Student.findOne({
              email: { $exists: true, $in: [mate] },
              "quizMateInvites.email": stud.email
            })
              .then(student => {
                if (student) {
                  let indx;
                  stud.sentQuizMate.filter((s, n) => {
                    if (s.email == mate) {
                      indx = n;
                      return true;
                    }
                  });
                  let stud_indx;
                  student.quizMateInvites.filter((s, n) => {
                    if (s.email == stud.email) {
                      stud_indx = n;
                      return true;
                    }
                  });
                  stud.sentQuizMate.splice(indx, 1);
                  student.quizMateInvites.splice(stud_indx, 1);

                  stud.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (saved) {
                      student.save((err, saved) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        } else if (saved) {
                          res.send({
                            msg: "Success"
                          });
                        }
                      });
                    }
                  });
                } else {
                  let indx;
                  stud.sentQuizMate.filter((s, n) => {
                    if (s.email == mate) {
                      indx = n;
                      return true;
                    }
                  });
                  stud.sentQuizMate.splice(indx, 1);
                  stud.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (saved) {
                      res.send({
                        msg: "Success. Note that the request never went over"
                      });
                    }
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          }
        } else {
          res.status(404).send({
            msg:
              "The student provided didn't sent any request to the provided mate"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.acceptQuizMateInvite = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          if (stud.email == mate) {
            res.status(403).send({
              msg: "You can't accept yourself. What did you do?"
            });
          } else {
            if (stud.quizMateInvites.length > 0) {
              for (let i = 0; i < stud.quizMateInvites.length; i++) {
                var qq = stud.quizMateInvites[i];
                if (mate == qq.email) {
                  Student.findOne({
                    email: { $exists: true, $in: [mate] },
                    "block.email": { $ne: stud.email },
                    "quizMate.email": { $ne: stud.email }
                  })
                    .then(student => {
                      if (student) {
                        // add to mates 1
                        stud.quizMate.unshift({
                          name: student.fullname,
                          photo: student.photo,
                          email: student.email,
                          id: student._id.toString(),
                          createdAt
                        });
                        // remove any invites 1
                        const newQInvite = stud.quizMateInvites.filter(
                          q => q.email != mate
                        );
                        stud.quizMateInvites = newQInvite;
                        //  remove any sent 1
                        const ds = stud.sentQuizMate.filter(
                          d1 => d1.email != mate
                        );
                        stud.sentQuizMate = ds;

                        stud.save((err, saved) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong"
                            });
                          } else if (saved) {
                            // sent notif 2
                            student.quizMateNotification.unshift({
                              msg: `'${stud.fullname}' recently accepted your quiz-mate invite`,
                              photo: stud.profilePic,
                              email: stud.email,
                              createdAt
                            });
                            // add to mates 2
                            student.quizMate.unshift({
                              name: stud.fullname,
                              photo: stud.photo,
                              email: stud.email,
                              id: _id,
                              createdAt
                            });
                            // remove any invites 2
                            const newQInvite1 = student.quizMateInvites.filter(
                              q1 => q1.email != stud.email
                            );
                            student.quizMateInvites = newQInvite1;
                            // remove any sent 2
                            const ds1 = student.sentQuizMate.filter(
                              d2 => d2.email != stud.email
                            );
                            student.sentQuizMate = ds1;
                            student.save((err, savingStud) => {
                              if (err) {
                                res.status(500).send({
                                  msg:
                                    "Something went wrong. Couldn't save new entry"
                                });
                              } else if (savingStud) {
                                res.send({
                                  msg: `You've suucessfully added '${qq.name}' to your quiz-mate list`
                                });
                              }
                            });
                          }
                        });
                      } else {
                        res.status(404).send({
                          msg: "Student is already your quiz mate"
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    });
                  break;
                } else if (i === stud.quizMateInvites.length - 1) {
                  res.status(404).send({
                    msg: "No request from that student"
                  });
                }
              }
            } else {
              res.status(500).send({
                msg: "No invite to accept"
              });
            }
          }
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.declineQuizMateInvite = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          if (stud.email == mate) {
            re.status(403).send({
              msg: "You can't decline yourself"
            });
          } else {
            if (stud.quizMateInvites.length > 0) {
              for (let i = 0; i < stud.quizMateInvites.length; i++) {
                var qq = stud.quizMateInvites[i];
                if (mate == qq.email) {
                  stud.quizMateInvites.splice(i, 1);
                  Student.findOne({
                    email: mate
                  })
                    .then(student => {
                      if (student) {
                        const sqm = student.sentQuizMate.filter(
                          sq => sq.email != stud.email
                        );
                        student.sentQuizMate = sqm;

                        student.save((err, savingStud) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong"
                            });
                          } else if (savingStud) {
                            stud.save((err, saved) => {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong"
                                });
                              } else if (saved) {
                                res.send({
                                  msg: "Success"
                                });
                              }
                            });
                          }
                        });
                      } else {
                        res.status(403).send({
                          msg: "Student doesn't exist"
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    });
                  break;
                } else if (i === stud.quizMateInvites.length - 1) {
                  res.status(404).send({
                    msg: "Nothing to delete"
                  });
                }
              }
            } else {
              res.status(400).send({
                msg: "You currently do not have any request"
              });
            }
          }
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.block = function(req, res) {
  const { _id, block } = req.body;

  if (!_id || !block) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ 
      _id,
      email : {$ne : block}
     })
      .then(stud => {
        if (stud) {
          Student.findOne({
            email: block
          })
          .then(student=>{
            if(student){
              console.log("hereee2");
              const QUIZMATE = stud.quizMate.filter(q=>(q.email != block))
              const SENTREQUEST = stud.sentQuizMate.filter(q => q.email != block);
              const MATEINVITES = stud.quizMateInvites.filter(q => q.email != block);
              stud.quizMate = QUIZMATE;
              stud.sentQuizMate = SENTREQUEST;
              stud.quizMateInvites = MATEINVITES;
              const BLOCK = stud.block.filter((b, n)=>(b.email != block))
              BLOCK.unshift({
                email: block
              })
              stud.block = BLOCK;

              const QUIZMATE1 = student.quizMate.filter(q=>(q.email != block))
              const SENTREQUEST1 = student.sentQuizMate.filter(q => q.email != block);
              const MATEINVITES1 = student.quizMateInvites.filter(q => q.email != block);
              student.quizMate = QUIZMATE1;
              student.sentQuizMate = SENTREQUEST1;
              student.quizMateInvites = MATEINVITES1;

              stud.save((err, saved) => {
                if (err) {
                  res.status(500).send({
                    msg: "Something went wrong"
                  });
                } else if (saved) {
                  student.save((err, savingStud)=>{
                    if(err){
                      res.status(500).send({
                        msg:"Something went wrong"
                      })
                    }else if(savingStud){
                      Exam.find({
                        author : _id,
                        match:{
                          opensAt : { $lte : createdAt }
                        },
                        author1_id : student._id.toString()
                      })
                      .then(exams=>{
                        if(exams.length > 0){
                          exams.forEach(e =>{
                            let remove_func = async()=>{
                              const maked = await e.author1_id.filter(auth=>{
                                let gotten = makers.filter(m=>{
                                  if(auth.id != m.id){
                                    return true
                                  }
                                })
                                if(gotten.length === makers.length){
                                  return true
                                }
                              })
                              const examMakers = await e.makers.filter(auth=>{
                                let gotten = makers.filter(m=>(auth.id != m.id))
                                if(gotten.length === makers.length){
                                  return true
                                }
                              })
                              console.log(maked, "maked")
                              console.log(examMakers, "examMakers")
                              const QUESTION = await e.question.filter(q=>{
                                let question_check = makers.filter(mk=>(mk.id != q.owner))
                                if(question_check.length === makers.length){
                                  return true
                                }
                              })
                              e.makers = examMakers
                              e.author1_id = maked
                              e.question = QUESTION
                              if(e.avg_duration){
                                e.duration = e.avg_duration * e.question.length
                              }
                            }
                            remove_func()
                            .then(()=>{
                              let save =async ()=> await e.save()
                              save()
                             })
                          })
                          res.send({
                            msg: "Success"
                          });
                        }else{
                          res.send({
                            msg: "Success"
                          });
                        }
                      })
                      .catch(err=>{
                        res.status(500).send({
                          msg:"Something went wrong"
                        })
                      })
                    }
                  })
                }
              });
            }else{
              res.status(400).send({
                msg:"Who you wish to block doesn't exist"
              })
            }
          })
          .catch(err=>{
            res.status(500).send({
              msg:"Something went wrong"
            })
          })
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.unblock = function(req, res) {
  const { _id, unblock } = req.body;

  if (!_id || !unblock) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ 
      _id,
      "email": {$ne : unblock}
    })
      .then(stud => {
        if (stud) {
          let unblock_func = async ()=>{
            const BLOCK = await stud.block.filter(b =>(b.email != unblock))
          stud.block = BLOCK
          }
          unblock_func()
          .then(()=>{
            stud.save((err, saved) => {
              if (err) {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              } else if (saved) {
                res.send({
                  msg: "Success"
                });
              }
            });
          })
        } else {
          res.status(404).send({
            msg: "Unblock operation failed"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.removeQuizMate = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          if (stud.email == mate) {
            res.status.send({
              msg: "You can't remove yourself"
            });
          } else {
            Student.findOne({
              email: { $exists: true, $in: [mate] },
              "quizMate.email": stud.email
            })
              .then(student => {
                if (student) {
                  const qq = stud.quizMate.filter(q => q.email != mate);
                  stud.quizMate = qq;

                  const qq1 = student.quizMate.filter(
                    q1 => q1.email != stud.email
                  );
                  student.quizMate = qq1;

                  const qM = stud.sentQuizMate.filter(q3 => q3.email != mate);
                  stud.sentQuizMate = qM;

                  const qM2 = student.sentQuizMate.filter(
                    q4 => q4.email != stud.email
                  );
                  student.sentQuizMate = qM2;

                  student.save((err, savingStud) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (savingStud) {
                      stud.save((err, saved) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        } else if (saved) {
                          Exam.find({
                            author : _id,
                            match:{
                              opensAt : { $lte : createdAt }
                            },
                            author1_id : student._id.toString()
                          })
                          .then(exams=>{
                            if(exams.length > 0){
                              exams.forEach(e =>{
                                let remove_func = async()=>{
                                  const maked = await e.author1_id.filter(auth=>{
                                    let gotten = makers.filter(m=>{
                                      if(auth.id != m.id){
                                        return true
                                      }
                                    })
                                    if(gotten.length === makers.length){
                                      return true
                                    }
                                  })
                                  const examMakers = await e.makers.filter(auth=>{
                                    let gotten = makers.filter(m=>(auth.id != m.id))
                                    if(gotten.length === makers.length){
                                      return true
                                    }
                                  })
                                  console.log(maked, "maked")
                                  console.log(examMakers, "examMakers")
                                  const QUESTION = await e.question.filter(q=>{
                                    let question_check = makers.filter(mk=>(mk.id != q.owner))
                                    if(question_check.length === makers.length){
                                      return true
                                    }
                                  })
                                  e.makers = examMakers
                                  e.author1_id = maked
                                  e.question = QUESTION
                                  if(e.avg_duration){
                                    e.duration = e.avg_duration * e.question.length
                                  }
                                }
                                remove_func()
                                .then(()=>{
                                 let save =async ()=> await e.save()
                                 save()
                                })
                              })
                              res.send({
                                msg: "Success"
                              });
                            }else{
                              res.send({
                                msg: "Success"
                              });
                            }
                          })
                          .catch(err=>{
                            res.status(500).send({
                              msg:"Quiz mate removed but something went wrong while trying to perform operations with exams"
                            })
                          })
                        }
                      });
                    }
                  });
                } else {
                  res.status(403).send({
                    msg: "That student isn't your quiz mate"
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          }
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

// exports.viewQuizMate = function(req, res) {
//   const { _id, mate } = req.body;

//   if (!_id || !mate) {
//     res.status(500).send({
//       msg: "Info incomplete"
//     });
//   } else {
//     Student.findOne({ _id })
//       .then(stud => {
//         if (stud) {
//           for (let i = 0; i < stud.quizMate.length; i++) {
//             var mt = stud.quizMate[i];
//             if (mate == mt.email) {
//               Student.findOne({ email: mate })
//                 .then(student => {
//                   if (student) {
//                     student["password"] = null;
//                     student["_id"] = null;
//                     res.send(student);
//                   } else {
//                     res.status(404).send({
//                       msg: "That quizmate no longer exists"
//                     });
//                   }
//                 })
//                 .catch(err => {
//                   res.status(500).send({
//                     msg: "Something went wrong"
//                   });
//                 });
//               break;
//             } else if (i === stud.block.length - 1) {
//               res.status(404).send({
//                 msg: "Quiz-mate not found"
//               });
//             }
//           }
//         } else {
//           res.status(404).send({
//             msg: "The student provided doesn't exist"
//           });
//         }
//       })
//       .catch(err => {
//         res.status(500).send({
//           msg: "Something went wrong"
//         });
//       });
//   }
// };

exports.viewQuizMate = function(req, res) {
  const { _id, mate } = req.body;

  if (!_id || !mate) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({
      _id,
      "blocked.email": { $ne: mate }
    })
      .then(stud => {
        if (stud) {
          let self;
          if (stud.email == mate) {
            self = true;
          } else {
            self = false;
          }
          if (self) {
            let toPrivate = false;
            student["password"] = null;
            student["_id"] = null;
            res.send({
              self,
              toPrivate,
              quiz_mate: student,
              quizmate: false,
              invited: false,
              cannottview: false,
              no_access: false
            });
          } else {
            Student.findOne({
              email: mate,
              "blocked.email": { $ne: stud.email }
            })
              .then(student => {
                if (student) {
                  let isExam = false
                  let examFind = async()=>{
                    Exam.find({
                      author_id : _id,
                      "author1_id.id" : student._id.toString()
                    })
                    .then(exams=>{
                      if(exams.length > 0){
                        isExam = true
                      }else{
                        isExam = false
                      }
                    })
                    .catch(err=>{
                      throw err
                    })
                  }
                  examFind()
                  .then(()=>{
                    let quizmate = false;
                    let invited = false;
                    let no_access = student.no_access;
                    let check = async () => {
                      await stud.quizMate.filter(q =>{
                        if(q.email == mate){
                          quizMate = true
                          return true
                        }
                      })
                      await stud.quizMateInvites.filter(q =>{
                        if(q.email == mate){
                          invited = true
                          return true
                        }
                      })
                    };
                    check().then(() => {
                      let toPrivate;

                      student["password"] = null;
                      student["_id"] = null;
                      student["quizMateNotification"] = null;
                      student["examNotification"] = null;
                      student["block"] = null;
                      student["sentQuizMate"] = null;
                      student["quizMateInvites"] = null;
                      student["groupInvites"] = null;
                      student["examInvites"] = null;
                      student["quizMate"] = null;
                      student["examScore"] = null;
                      student["groupNotification"] = null;
                      if (no_access && quizmate) {
                        toPrivate = false;
                      } else if (no_access && !quizmate) {
                        toPrivate = true;
                      } else if (!no_access) {
                        toPrivate = false;
                      }
                      res.send({
                        self,
                        toPrivate,
                        quiz_mate: student,
                        quizmate,
                        invited,
                        isExam,
                        cannottview: false,
                        no_access
                      });
                    });
                  })
                  .catch(err=>{
                    res.status(500).send({
                      msg:"Something went wrong"
                    })
                  })
                } else {
                  res.status(404).send({
                    msg: "You can't view",
                    cannottview: true
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          }
        } else {
          res.status(404).send({
            msg: "You can't view",
            cannottview: true
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.declineGroupInvite = function(req, res) {
  const { _id, group_id } = req.body;

  if (!_id || !group_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          const gp = stud.groupInvites.filter(g => g.group_id != group_id);
          stud.groupInvites = gp;
          stud.save((err, saved) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong"
              });
            } else if (saved) {
              res.send({
                msg: "Success"
              });
            }
          });
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.declineExamInvite = function(req, res) {
  const { _id, exam_id } = req.body;

  if (!_id || !exam_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          const ex = stud.examInvites.filter(e => e.exam_id != exam_id);
          stud.examInvites = ex;
          stud.save((err, saved) => {
            if (err) {
              res.status(500).send({
                msg: "Something went wrong"
              });
            } else if (saved) {
              res.send({
                msg: "Success"
              });
            }
          });
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.leaveGroup = function(req, res) {
  const { _id, group_id } = req.body;

  if (!_id || !group_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          const gp = stud.group.filter(g => g.name_id == group_id);
          if (gp.length > 0) {
            Group.findOne({
              _id: group_id,
              name: { $exists: true },
              "members.name_id": _id
            })
              .then(group => {
                if (group) {
                  if (group.creator == _id) {
                    res.status(500).send({
                      msg: "Choose a successor before leaving the group"
                    });
                  } else {
                    const mem = group.members.filter(m => _id != m.name_id);
                    if (mem.length === 0) {
                      Group.deleteOne({ _id: group_id })
                        .then(del => {
                          res.send({
                            msg: "Group deleted successfully"
                          });
                        })
                        .catch(err => {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        });
                    } else {
                      group.members = mem;
                      group.num = group.members.length;
                      group.save((err, saved) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        } else if (saved) {
                          const grp = stud.group.filter(
                            g1 => g1.name_id != group_id
                          );
                          stud.group = grp;
                          stud.save((err, saved) => {
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong"
                              });
                            } else if (saved) {
                              res.send({
                                msg: "Success"
                              });
                            }
                          });
                        }
                      });
                    }
                  }
                } else {
                  res.status(404).send({
                    msg: "You weren't a member of that group, so why leaving?"
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          } else {
            res.status(404).send({
              msg: "You do not belong to the group you provided"
            });
          }
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.chooseSuccessor = function(req, res) {
  const { _id, group_id, suc_id } = req.body;

  if (!_id || !group_id || !suc_id) {
    res.status(400).send({
      msg: "Information incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          Group.findOne({
            _id: group_id,
            creator: _id
          })
            .then(group => {
              if (group) {
                Student.findOne({
                  _id,
                  "group.name_id": group_id
                })
                  .then(student => {
                    if (student) {
                      for (let i = 0; i < group.members.length; i++) {
                        let scc = group.members[i];
                        if (suc_id == scc.name_id) {
                          group.members[i].admin = true;
                          group.creator = suc_id;
                          group.save((err, saved) => {
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong"
                              });
                            } else if (saved) {
                              res.send({
                                msg: `${student.fullname} was made your successor successfully`
                              });
                            }
                          });
                          break;
                        } else if (i === group.members.length - 1) {
                          res.status(400).send({
                            msg: "Your successor must be a member of the group"
                          });
                        }
                      }
                    } else {
                      res.status(404).send({
                        msg: "The student to succeed you doesn't exist"
                      });
                    }
                  })
                  .catch(err => {
                    res.status(500).send({
                      msg: "Something went wrong"
                    });
                  });
              } else {
                res.status(500).send({
                  msg: "You're not an admin in the group you provided"
                });
              }
            })
            .catch(err => {
              res.status(500).send({
                msg: "Something went wrong"
              });
            });
        } else {
          res.status(404).send({
            msg: "The student you provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.sendExamInvite = function(req, res) {
  const { _id, sender_id, exam_id, group_id } = req.body;

  if (!_id || !sender_id || !exam_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: sender_id })
      .then(student => {
        if (student) {
          if (sender_id == student._id.toString()) {
            res.status(403).send({
              msg: "You can't send an invite to yourself"
            });
          } else {
            Student.findOne({
              _id,
              "quizMate.email": student.email
            })
              .then(stud => {
                if (stud) {
                  Exam.findOne({ _id })
                    .then(exam => {
                      if (exam) {
                        if (
                          Date.now() >= exam.opensAt &&
                          Date.now() <=
                            exam.expiresAt + exam.duration * 60 * 1000
                        ) {
                          res.status(404).send({
                            msg:
                              "You can't send anyone an invitation to write this exam because the exam has already started"
                          });
                        } else if (
                          Date.now() >
                          exam.expiresAt + exam.duration * 60 * 1000
                        ) {
                          res.status(404).send({
                            msg:
                              "You can't send anyone an invitation to write this exam because the exam has already ended"
                          });
                        } else if (Date.now() < exam.opensAt) {
                          if (exam.grouped) {
                            Group.findOne({
                              _id,
                              name: { $exists: true },
                              "members.name_id": _id,
                              "members.name_id": sender_id
                            })
                              .then(group => {
                                if (group) {
                                  let msg = `You were invited by '${student.fullname}' to participate in the grouped '${exam.category}' exam created by '${exam.author}'.\n The exam is scheduled to start on ${exam.opensAt} and close on ${exam.expiresAt}`;
                                  stud.examInvites.unshift({
                                    msg,
                                    sender_email: student.email,
                                    exam_id,
                                    group_id,
                                    createdAt
                                  });
                                  stud.save((err, saved) => {
                                    if (err) {
                                      res.status(500).send({
                                        msg: "Something went wrong"
                                      });
                                    } else if (saved) {
                                      res.send({
                                        msg: "Exam invite sent successfully"
                                      });
                                    }
                                  });
                                } else {
                                  res.status(400).send({
                                    msg:
                                      "You can't send an exam invite for that grouped exam"
                                  });
                                }
                              })
                              .catch(err => {
                                res.status(500).send({
                                  msg: "Something went wrong"
                                });
                              });
                          } else {
                            let msg = `You were invited by ${student.fullname} to participate in the ${exam.category} exam created by ${exam.author}.\n The exam is scheduled to start on ${exam.opensAt} and close on ${exam.expiresAt}`;
                            stud.examInvites.unshift({
                              msg,
                              sender_email: student.email,
                              exam_id,
                              group_id,
                              createdAt
                            });
                            stud.save((err, saved) => {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong"
                                });
                              } else if (saved) {
                                res.send({
                                  msg: "Exam invite sent successfully"
                                });
                              }
                            });
                          }
                        }
                      } else {
                        res.status(404).send({
                          msg: "The exam you provided doesn't exist"
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    });
                } else {
                  res.status(404).send({
                    msg: "Exam Invite not sent"
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              });
          }
        } else {
          res.status(404).send({
            msg: "The student you provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.sendGroupInvite = function(req, res) {
  const { _id, group_id, sender_id } = req.body;
  if (!_id || !group_id || !sender_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: sender_id })
      .then(student => {
        if (student) {
          if (sender_id == _id) {
            res.status(403).send({
              msg: "You can't send an invite to yourself"
            });
          } else {
            Student.findOne({
              _id,
              "quizMate.email": student.email
            })
              .then(stud => {
                if (stud) {
                  Group.findOne({
                    _id: group_id,
                    name: { $exists: true },
                    "members.name_id": sender_id,
                    "members.name_id": { $ne: _id }
                  })
                    .then(group => {
                      if (group) {
                        let isAdmin = false;
                        for (nn in group.members) {
                          if (sender_id == group.members[nn].name_id) {
                            if (group.members[nn].admin) {
                              isAdmin = true;
                            } else {
                              isAdmin = false;
                            }
                          }
                        }
                        msg = `You were invited by '${student.fullname}' to join the group ${group.name}. The group consist of ${group.members.length} members`;
                        if (group.visibility) {
                          stud.groupInvites.unshift({
                            msg,
                            sender_email: student.email,
                            group_id,
                            createdAt
                          });
                          stud.save((err, saved) => {
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong1"
                              });
                              throw err;
                            } else if (saved) {
                              res.send({
                                msg: "Group invite sent successfully"
                              });
                            }
                          });
                        } else if (!group.visibility) {
                          if (isAdmin) {
                            stud.groupInvites.unshift({
                              msg,
                              sender_email: student.email,
                              group_id,
                              createdAt
                            });
                            stud.save((err, saved) => {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong2"
                                });
                              } else if (saved) {
                                res.send({
                                  msg: "Group invite sent successfully"
                                });
                              }
                            });
                          } else if (!isAdmin) {
                            res.status(500).send({
                              msg:
                                "You can't invite anyone to the group because you're not an Admin"
                            });
                          }
                        }
                      } else {
                        res.status(403).send({
                          msg: "Group invite not sent"
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    });
                } else {
                  res.status(404).send({
                    msg: "The student you want to invite isn't your quiz mate"
                  });
                }
              })
              .catch(err => {
                res.status(500).send({
                  msg: "Something went wrong3"
                });
              });
          }
        } else {
          res.status(404).send({
            msg: "The sender you provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong5"
        });
      });
  }
};

exports.check = function(req, res) {
  const { _id, group_id } = req.body;

  if (!_id || !group_id) {
    res.status(500).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({
      _id,
      "groupNotification.createdAt": 1588065517804,
      "groupNotification.createdAt": 1588065494618
    })
      .then(stud => {
        if (stud) {
          res.send(stud);
        } else {
          res.status(404).send({
            msg: "The student provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.accountToPrivate = function(req, res) {
  const { _id, no_access } = req.body;
  if (
    !_id ||
    typeof no_access != "boolean" ||
    no_access == undefined ||
    no_access == null
  ) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          if (no_access == stud.no_access) {
            res.status(400).send({
              msg: "Nothing to change"
            });
          } else {
            stud.no_access = no_access;
            stud.save((err, saved) => {
              if (err) {
                res.status(500).send({
                  msg: "Something went wrong"
                });
              } else if (saved) {
                res.send({
                  msg: "Success"
                });
              }
            });
          }
        } else {
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
      });
  }
};

exports.getNewsFeed = function(req, res) {
  const { _id } = req.body;
  if (!_id) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          NewsFeed.find({
            id: _id
          })
            .sort({ createdAt: -1 })
            .populate({
              path: "feed_id"
            })
            .then(nf => {
              // console.log(nf[0]);
              if (nf.length > 0) {
                // console.log(notif);
                // nf.sort((a, b) => b.createdAt - a.createdAt);
                res.send(nf);
              } else {
                res.status(403).send({
                  msg: "No news feed available at the moment"
                });
              }
            })
            .catch(err => {
              res.status(500).send({
                msg: "Something went wrong1"
              });
              throw err;
            });
        } else {
          res.status(404).send({
            msg: "The student you provided doesn't exist"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong2"
        });
        throw err;
      });
  }
};

exports.allNewsFeed = function(req, res) {
  NewsFeed.find()
    .sort({ createdAt: -1 })
    .then(nf => {
      res.send(nf);
    })
    .catch(err => {
      res.status(500).send({
        msg: "Something went wrong"
      });
    });
};
// decline group invite, decline exam, leave group
// update quiz-mate path when accepted
// if delted, remove sent requests
//  have sent request path
