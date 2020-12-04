var Exam = require("../models/exam");
var Examlist = require("../models/examList");
var Student = require("../models/student");
var Group = require("../models/group");
var NewsFeed = require("../models/newsFeed");
let createdAt = new Date();

// ERROR = res.status(500).send({ msg: "Something went wrong" });

exports.home = function (req, res) {
  res.send("Home");
};

exports.postExam = function (req, res) {
  const {
    name,
    group_id,
    question,
    avg_duration,
    max_question,
    max_count,
    author1_id,
    category,
    section,
    expiresAt,
    opensAt,
    author_id,
  } = req.body;
  var { duration } = req.body;
  let all_ids = [];

  let option_check = async () => {
    const checker = await question.map((q) => {
      return q.options.filter((m, n) => {
        if (m.correct) {
          return true;
        }
      });
    });
    console.log(checker, "checker");
    let prop = [];
    await checker.filter((c, n) => {
      if (c.length > 1 || c.length == 0) {
        prop.push(n);
      }
    });
    return prop;
  };
  option_check().then((prop) => {
    if (prop.length > 0) {
      const ERROR_QUES = prop.map((m) => ({
        question: question[m],
        index: m + 1,
      }));
      res.status(400).send({
        msg: "You are to provide one answer for each of these questions",
        question: ERROR_QUES,
      });
    } else {
      if (group_id && avg_duration === null) {
        res.status(400).send({
          msg: "Group tests must have average duration",
        });
      } else if (
        (author1_id == undefined || !author1_id || author1_id.length > 0) &&
        avg_duration === null
      ) {
        res.status(400).send({
          msg: "Please provide an average duration",
        });
      } else if (opensAt > expiresAt) {
        res.status(400).send({
          msg: "Exams cannot expire earlier than they're meant to start",
        });
      } else if (opensAt < Date.now()) {
        res.status(400).send({
          msg: "Exams cannot start earlier than the moment",
        });
      } else if (
        !name ||
        !question ||
        question.length === 0 ||
        !category ||
        !section ||
        !expiresAt ||
        !opensAt ||
        !author_id
      ) {
        res.status(400).send({
          msg: "Please fill the required field(s)",
        });
      } else {
        let grouped = false;
        if (group_id) {
          grouped = true;
        } else {
          grouped = false;
        }
        let verify = async () => {
          await question.forEach((q, n) => {
            question[n].owner = author_id;
          });
        };
        verify().then(() => {
          if (max_question && question.length > max_question) {
            let diff = question.length - max_question;
            question.splice(max_question, diff);
          }
          if (avg_duration) {
            duration = avg_duration * question.length;
          }
          Student.findOne({ _id: author_id })
            .then((stud) => {
              if (stud) {
                all_ids.push(author_id);
                if (stud.quizMate.length > 0 && !grouped) {
                  all_ids = [];
                  all_ids = stud.quizMate.map((qm) => qm.id);
                  all_ids.push(author_id);
                }
                let toPostExam = async () => {
                  let makers = [];
                  makers.push({
                    id: author_id,
                    creator: true,
                    question: question.length,
                  });
                  var exam = new Exam({
                    name,
                    grouped,
                    group_id,
                    author: stud.fullname,
                    author1_id,
                    author_id,
                    expiresAt,
                    max_count,
                    avg_duration,
                    opensAt,
                    makers,
                    section,
                    duration,
                    max_question,
                    question,
                    category,
                  });
                  await exam.save((err, saved) => {
                    if (err) {
                      throw err;
                    }
                  });
                  return exam;
                };
                let examlistsave = async (saved) => {
                  await Examlist.findOne({ section })
                    .then((e) => {
                      var list = {
                        name: category,
                        exams: [saved._id],
                      };
                      if (e) {
                        let xx;
                        const SEC = e.list.filter((s, n) => {
                          if (s.name == category) {
                            xx = n;
                            return true;
                          }
                        });
                        if (SEC.length > 0) {
                          e.list[xx].exams.unshift(saved.id);
                        } else {
                          e.list.unshift(list);
                        }
                        e.save((err, newSave) => {
                          if (err) {
                            throw err;
                          }
                        });
                      } else {
                        var Exam_list = new Examlist({
                          section,
                          list,
                        });
                        Exam_list.save((err, newList) => {
                          if (err) {
                            throw err;
                          }
                        });
                      }
                    })
                    .catch((err) => {
                      throw err;
                    });
                  return saved;
                };
                let saved_newsFeed = async (
                  { grp, gp_ID, grN, all_ids },
                  saved
                ) => {
                  let news_feed = new NewsFeed({
                    grouped: grp,
                    group_id: gp_ID,
                    groupName: grN,
                    creator: stud.fullname,
                    creator_id: author_id,
                    feed_id: saved._id.toString(),
                    id: all_ids,
                    createdAt,
                  });
                  await news_feed.save((err, newFeedSave) => {
                    if (err) {
                      throw err;
                    }
                  });
                  return saved;
                };
                let author_verify = async (isGroup, group) => {
                  let next = false;
                  if (isGroup) {
                    if (author1_id.length > 0) {
                      const authors = author1_id.map((a) => {
                        return group.members.filter((g) => g.name_id == a.id);
                      });
                      if (authors.length === author1_id) {
                        next = true;
                      } else {
                        next = false;
                      }
                    } else {
                      next = true;
                    }
                  } else {
                    if (author1_id.length > 0) {
                      const authors1 = author1_id.filter((a) => {
                        let checkedfig = stud.quizMate.filter(
                          (g) => g.id == a.id
                        );
                        if (checkedfig.length > 0) {
                          return true;
                        }
                      });
                      if (authors1.length === author1_id.length) {
                        next = true;
                      } else {
                        next = false;
                      }
                    } else {
                      next = true;
                    }
                  }
                  return next;
                };
                if (grouped) {
                  Group.findOne({
                    _id: group_id,
                    "members.name_id": author_id,
                  })
                    .then((group) => {
                      if (group) {
                        author_verify(true, group).then((next) => {
                          if (!next) {
                            res.status(400).send({
                              msg:
                                "Ensure all the provided co-creators are members of your group",
                            });
                          } else if (next) {
                            let group_notif = async (saved) => {
                              group.examNotification.unshift({
                                msg: `${
                                  stud.fullname
                                } created an exam scheduled to be open on ${Date.parse(
                                  saved.opensAt
                                ).toLocaleString()} and close on ${Date.parse(
                                  saved.expiresAt
                                ).toLocaleString()}`,
                              });
                              await group.save((err, savedgroup) => {
                                if (err) {
                                  throw err;
                                }
                              });
                              return saved;
                            };
                            all_ids = group.members.map((gm) => gm.name_id);
                            if (group.visibility) {
                              toPostExam()
                                .then((saved) =>
                                  group_notif(saved)
                                    .then((saved) => {
                                      saved_newsFeed(
                                        {
                                          grp: null,
                                          gr_ID: null,
                                          grN: null,
                                          all_ids,
                                        },
                                        saved
                                      )
                                        .then((saved) => {
                                          res.send(saved);
                                        })
                                        .catch((err) => {
                                          res.status(500).send({
                                            msg: "Something went wrong9 i",
                                          });
                                          throw err;
                                        });
                                    })
                                    .catch((err) => {
                                      res.status(500).send({
                                        msg: "Something went wrong2",
                                      });
                                      throw err;
                                    })
                                )
                                .catch((err) => {
                                  res.status(500).send({
                                    msg: "Something went wrong3",
                                  });
                                  throw err;
                                });
                            } else if (!group.visibility) {
                              for (
                                let add = 0;
                                add < group.members.length;
                                add++
                              ) {
                                var admin = group.members[add];
                                if (author_id == admin.name_id && admin.admin) {
                                  toPostExam()
                                    .then((saved) =>
                                      group_notif(saved)
                                        .then((saved) => {
                                          saved_newsFeed(
                                            {
                                              grp: null,
                                              gr_ID: null,
                                              grN: null,
                                              all_ids,
                                            },
                                            saved
                                          )
                                            .then((saved) => {
                                              res.send(saved);
                                            })
                                            .catch((err) => {
                                              res.status(500).send({
                                                msg: "Something went wrong9 i",
                                              });
                                              throw err;
                                            });
                                        })
                                        .catch((err) => {
                                          res.status(500).send({
                                            msg: "Something went wrong5",
                                          });
                                          throw err;
                                        })
                                    )
                                    .catch((err) => {
                                      res.status(500).send({
                                        msg: "Something went wrong6",
                                      });
                                      throw err;
                                    });
                                  break;
                                } else if (add === group.members.length - 1) {
                                  res.status(404).send({
                                    msg:
                                      "This is a closed group and only admins can post questions",
                                  });
                                }
                              }
                            }
                          }
                        });
                      } else {
                        res.status(404).send({
                          msg: "You're not a member of the group you provided",
                        });
                      }
                    })
                    .catch((err) => {
                      res.status(500).send({
                        msg: "Something went wrong7",
                      });
                      throw err;
                    });
                } else if (!grouped) {
                  author_verify(false).then((next) => {
                    if (!next) {
                      res.status(400).send({
                        msg:
                          "Ensure that all the co-creators you chose are your quiz-mates",
                      });
                    } else if (next) {
                      toPostExam()
                        .then((saved) => {
                          examlistsave(saved)
                            .then((saved) => {
                              saved_newsFeed(
                                { grp: null, gr_ID: null, grN: null, all_ids },
                                saved
                              )
                                .then((saved) => {
                                  stud.exam.unshift(saved);
                                  stud.save((err, savingStud) => {
                                    if (err) {
                                      res.status(500).send({
                                        msg: "Something went wrong new*",
                                      });
                                      throw err;
                                    } else if (savingStud) {
                                      res.send(saved);
                                    }
                                  });
                                })
                                .catch((err) => {
                                  res.status(500).send({
                                    msg: "Something went wrong9 i",
                                  });
                                  throw err;
                                });
                            })
                            .catch((err) => {
                              res.status(500).send({
                                msg: "Something went wrong9 i",
                              });
                              throw err;
                            });
                        })
                        .catch((err) => {
                          res.status(500).send({
                            msg: "Something went wrong9",
                          });
                          throw err;
                        });
                    }
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The student you provided wasn't found",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({
                msg: "Something went wrong12",
              });
              throw err;
            });
        });
      }
    }
  });
};

exports.exam = function (req, res) {
  Exam.find({})
    .then((exams) => {
      if (exams.length > 0) {
        res.send(exams);
      } else {
        res.status(400).send({
          msg: "No exams yet",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ msg: "Something went wrong" });
      // throw err;
    });
};

exports.deleteList = function (req, res) {
  Examlist.deleteMany({})
    .then((exams) => {
      Exam.deleteMany({})
        .then((exams) => {
          NewsFeed.deleteMany({})
            .then((exams) => {
              res.send({
                msg: "Success",
              });
            })
            .catch((err) => {
              res.status(500).send({ msg: "Something went wrong" });
              // throw err;
            });
        })
        .catch((err) => {
          res.status(500).send({ msg: "Something went wrong" });
          // throw err;
        });
    })
    .catch((err) => {
      res.status(500).send({ msg: "Something went wrong" });
      // throw err;
    });
};

exports.examGet = function (req, res) {
  const { _id } = req.body;
  if (!_id) {
    res.status(400).send({
      msg:
        "That exam might have being deleted, is not longer available or might be full",
    });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          res.send(exam);
        } else {
          res.status(400).send({
            msg:
              "The exam no longer exist. It may have being deleted by the author",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong" });
        // throw err;
      });
  }
};

exports.deleteExam = function (req, res) {
  const { _id } = req.body;
  let msg = " but not removed from list";
  if (!_id) {
    res.status(400).send({
      msg: "Info incomplete",
    });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          time = new Date(
            exam.expiresAt + exam.duration * 60 * 1000
          ).toLocaleString();
          if (Date.now() > exam.opensAt) {
            res.status(404).send({
              msg: `You can't change anything in this exam because the exam has already started or has ended.`,
            });
          } else if (Date.now() < exam.opensAt) {
            Examlist.findOne({
              section: exam.section,
              list: {
                $elemMatch: {
                  name: exam.category,
                  exams: {
                    $elemMatch: {
                      $in: _id,
                    },
                  },
                },
              },
            })
              .then((list) => {
                if (list) {
                  let indx;
                  let ex_indx;
                  if (list.list.length > 0) {
                    let checkList = async () => {
                      const ex_list = await list.list.filter((l, n) => {
                        if (l.name == exam.category) {
                          indx = n;
                          return true;
                        }
                      });
                      await ex_list[0].exams.filter((ex, m) => {
                        if (ex == _id) {
                          ex_indx = m;
                          return true;
                        }
                      });
                    };
                    checkList().then(() => {
                      if (
                        list.list[indx].exams.length === 1 &&
                        list.list.length > 1
                      ) {
                        list.list.splice(indx, 1);
                        list.save((err, saved) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          } else if (saved) {
                            Exam.deleteOne({ _id })
                              .then((exam) => {
                                NewsFeed.deleteOne({ feed_id: _id })
                                  .then((exams) => {
                                    msg = " and also removed from list";
                                    res.send({
                                      msg: "Exam deleted" + msg,
                                    });
                                  })
                                  .catch((err) => {
                                    res
                                      .status(500)
                                      .send({ msg: "Something went wrong" });
                                  });
                              })
                              .catch((err) => {
                                res.status(500).send({
                                  msg: "Invalid exam Id",
                                });
                              });
                          }
                        });
                      } else if (list.list[indx].exams.length > 1) {
                        let t = list.list[indx].exams.splice(ex_indx, 1);
                        list.save((err, saved) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          } else if (saved) {
                            Exam.deleteOne({ _id })
                              .then((exam) => {
                                NewsFeed.deleteOne({ feed_id: _id })
                                  .then((exams) => {
                                    msg = " and also removed from list";
                                    res.send({
                                      msg: "Exam deleted" + msg,
                                    });
                                  })
                                  .catch((err) => {
                                    res
                                      .status(500)
                                      .send({ msg: "Something went wrong" });
                                  });
                              })
                              .catch((err) => {
                                res.status(500).send({
                                  msg: "Invalid exam Id",
                                });
                              });
                          }
                        });
                      } else if (
                        list.list.length === 1 &&
                        list.list[indx].exams.length === 1
                      ) {
                        Examlist.deleteOne({ section: exam.section })
                          .then((x) => {
                            msg = " and also removed from list";
                            Exam.deleteOne({ _id })
                              .then((exam) => {
                                NewsFeed.deleteOne({ feed_id: _id })
                                  .then((exams) => {
                                    res.send({
                                      msg: "Exam deleted" + msg,
                                    });
                                  })
                                  .catch((err) => {
                                    res
                                      .status(500)
                                      .send({ msg: "Something went wrong" });
                                  });
                              })
                              .catch((err) => {
                                res.status(500).send({
                                  msg: "Invalid exam Id",
                                });
                              });
                          })
                          .catch((err) => {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          });
                      }
                    });
                  } else {
                    Exam.deleteOne({ _id })
                      .then((exam) => {
                        NewsFeed.deleteOne({ feed_id: _id })
                          .then((exams) => {
                            msg = ", but something is not right";
                            res.send({
                              msg: "Exam deleted" + msg,
                            });
                          })
                          .catch((err) => {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong" });
                          });
                      })
                      .catch((err) => {
                        res.status(500).send({
                          msg: "Invalid exam Id",
                        });
                      });
                  }
                } else {
                  res.status(404).send({
                    msg: "No such exam",
                  });
                }
              })
              .catch((err) => {
                res.status(500).send({ msg: "Something went wrong" });
                throw err;
              });
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.getList = function (req, res) {
  Examlist.find({})
    .then((lists) => {
      if (lists.length > 0) {
        res.send({
          lists,
          date_early: Date.parse("5/20/2020, 10:57:00 PM"),
          date_p: Date.parse("5/20/2020, 11:10:00 PM"),
        });
      } else {
        res.status(400).send({
          msg: "No exams yet",
          date_early: Date.parse("5/20/2020, 09:53:00 AM"),
          date_p: Date.parse("5/20/2020, 11:10:00 PM"),
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ msg: "Something went wrong" });
      throw err;
    });
};

exports.getExam = function (req, res) {
  const { _id, student_id, group_id } = req.body;

  if (!_id || !student_id) {
    res.status(400).send({
      msg:
        "Something went wrong. \n We're currently collecting information about the error. \n Please log in again or check your internet connection",
    });
  } else {
    Student.findOne({ _id: student_id })
      .then((stud) => {
        if (stud) {
          Exam.findOne({ _id })
            .then((exam) => {
              if (exam) {
                let isMaker = false;
                let maker_func = async () => {
                  const MKR = await exam.makers.filter(
                    (e, n) => e.id == student_id
                  );
                  if (MKR.length > 0) {
                    isMaker = true;
                  }
                  return isMaker;
                };
                maker_func().then((isMaker) => {
                  if (isMaker) {
                    if (Date.now() < exam.opensAt) {
                      res.status(400).send({
                        msg: "This exam hasn't commenced. Wait till it does",
                      });
                    } else if (Date.now() > exam.expiresAt) {
                      res.status(400).send({
                        msg: "This exam is no longer available",
                      });
                    } else if (
                      Date.now() >= exam.opensAt &&
                      Date.now() <= exam.expiresAt
                    ) {
                      let MKR_score = [];
                      let check_maker = async () => {
                        if (exam.makers_score.length > 0) {
                          MKR_score = await exam.makers_score.filter(
                            (e) => e.id == student_id
                          );
                        }
                      };
                      check_maker().then(() => {
                        if (MKR_score.length > 0) {
                          let written1 = [];
                          let check_maker_score = async () => {
                            if (stud.examScore.length > 0) {
                              written1 = await stud.examScore.filter(
                                (e) => _id == e.id
                              );
                            }
                          };
                          check_maker_score().then(() => {
                            if (written1.length > 0) {
                              res.status(400).send({
                                msg:
                                  "You cannot participate in this examination as you have written it already",
                              });
                            } else {
                              res.send(exam);
                            }
                          });
                        } else {
                          exam.makers_score.unshift({
                            id: student_id,
                          });
                          exam.save((err, saved) => {
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong1",
                              });
                              throw err;
                            } else if (saved) {
                              res.send(saved);
                            }
                          });
                        }
                      });
                    }
                  } else {
                    const written = stud.examScore.filter((e) => _id == e.id);
                    if (written.length > 0) {
                      res.status(400).send({
                        msg:
                          "You cannot participate in this examination as you have written it already",
                      });
                    } else {
                      let toGetExam = async () => {
                        if (Date.now() < exam.opensAt) {
                          res.status(400).send({
                            msg:
                              "This exam hasn't commenced. Wait till it does",
                          });
                        } else if (Date.now() > exam.expiresAt) {
                          res.status(400).send({
                            msg: "This exam is no longer available",
                          });
                        } else if (
                          Date.now() >= exam.opensAt &&
                          Date.now() <= exam.expiresAt
                        ) {
                          if (exam.writers.length === 0) {
                            exam.writers.unshift({
                              id: stud._id,
                              score: null,
                              position: null,
                            });
                            exam.count = exam.count + 1;
                            exam.save((err, savedExam) => {
                              if (err) {
                                res
                                  .status(500)
                                  .send({ msg: "Something went wrong2" });
                                throw err;
                              } else if (savedExam) {
                                res.send(savedExam);
                              }
                            });
                          } else {
                            let wrt_func = async () => {
                              const WRT = await exam.writers.filter(
                                (e, n) => e.id == student_id
                              );
                              if (WRT.length < 1) {
                                exam.writers.unshift({
                                  id: stud._id,
                                  score: null,
                                  position: null,
                                });
                                exam.count = exam.count + 1;
                                exam.save((err, savedExam) => {
                                  if (err) {
                                    res.status(500).send({
                                      msg: "Something went wrong3",
                                    });
                                    throw err;
                                  } else if (savedExam) {
                                    res.send(savedExam);
                                  }
                                });
                              } else {
                                res.send(exam);
                              }
                            };
                            wrt_func();
                          }
                        }
                      };
                      if (exam.grouped) {
                        Group.findOne({
                          _id: group_id,
                          "members.name_id": student_id,
                        })
                          .then((group) => {
                            if (group) {
                              toGetExam();
                            } else {
                              res.status(400).send({
                                msg: "You can't get that grouped test",
                              });
                            }
                          })
                          .catch((err) => {
                            res.status(500).send({
                              msg: "Something went wrong4",
                            });
                            throw err;
                          });
                      } else if (!exam.grouped || exam.grouped == null) {
                        toGetExam();
                      }
                    }
                  }
                });
              } else {
                res.status(404).send({
                  msg: "You can't get that exam",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({ msg: "Something went wrong5" });
              throw err;
            });
        } else {
          res.status(404).send({
            msg: "That student doesn't exist",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong6" });
        throw err;
      });
  }
};

exports.answerExam = function (req, res) {
  const { _id, exam, student_id } = req.body;
  let failed = [];
  let score = 0;

  if (!_id || !exam || !student_id) {
    res.status(400).send({
      msg: "Something went wrong1",
    });
  } else {
    Exam.findOne({
      _id,
    })
      .then((list) => {
        if (list) {
          let question_list = list.question.map((q, n) => n);
          let write_func = async () => {
            let go_on = false;
            let WRITER = true;
            const toWrite = await list.writers.filter((g) => {
              if (g.id == student_id && !g.score) {
                go_on = true;
                return true;
              }
            });
            if (toWrite.length === 0) {
              await list.makers_score.filter((g) => {
                if (g.id == student_id && !g.score) {
                  go_on = true;
                  WRITER = false;
                  return true;
                }
              });
            } else {
              go_on = true;
            }
            return {
              go_on,
              WRITER,
            };
          };
          write_func().then((go_on) => {
            if (!go_on.go_on) {
              res.status(400).send({
                msg:
                  "This exam is available to you, you may consider getting it or wait for your results",
              });
            } else {
              let no_double = [];
              let answer = async () => {
                await exam.forEach((ex) => {
                  var option = ex.option;
                  var q = ex.question;
                  let toAns = list.question.filter((a, n) => {
                    if (a._id == q) {
                      let isStop = no_double.filter((nd) => nd == n);
                      if (isStop.length == 0) {
                        question_list = question_list.filter((q) => n != q);
                        no_double.push(n);
                        return true;
                      }
                    }
                  });
                  if (toAns.length > 0) {
                    let pickOpt = toAns[0].options.filter((opt) => {
                      if (opt._id == option) {
                        if (opt.correct) {
                          score += 1;
                        } else {
                          failed.push({
                            question: q,
                            option,
                          });
                        }
                        return true;
                      }
                    });
                    if (pickOpt.length == 0) {
                      failed.push({
                        question: q,
                        option: null,
                      });
                    }
                  }
                });
              };
              if (list.grouped && list.group_id) {
                Group.findOne({
                  _id: list.group_id,
                  "members.name_id": student_id,
                })
                  .then((group) => {
                    if (group) {
                      answer().then(() => {
                        question_list.forEach((q) => {
                          failed.push({
                            question: list.question[q]._id.toString(),
                            option: null,
                          });
                        });
                        Student.findOne({ _id: student_id })
                          .then((stud) => {
                            if (stud) {
                              stud.examScore.unshift({
                                id: _id,
                                name: list.name,
                                score,
                                failed,
                                createdAt: new Date(),
                              });
                              stud.save((err, newScore) => {
                                if (err) {
                                  res
                                    .status(500)
                                    .send({ msg: "Something went wrong2" });
                                  throw err;
                                } else if (newScore) {
                                  let toPer =
                                    (score / list.question.length) * 100;
                                  let per = toPer.toFixed(2);
                                  let per_check = per.toString().split(".");
                                  if (per_check[1] == "00") {
                                    per = parseInt(per_check[0], 10);
                                  }
                                  if (go_on.WRITER) {
                                    list.writers.filter((w, n) => {
                                      if (w.id == student_id) {
                                        writer_index = n;
                                        list.writers[n].score = score;
                                        return true;
                                      }
                                    });
                                  } else {
                                    list.makers_score.filter((w, n) => {
                                      if (w.id == student_id) {
                                        writer_index = n;
                                        list.makers_score[n].score = score;
                                        return true;
                                      }
                                    });
                                  }
                                  list.save((err, savedE) => {
                                    if (err) {
                                      res.status(500).send({
                                        msg: "Something went wrong3",
                                      });
                                      throw err;
                                    } else if (savedE) {
                                      res.send({
                                        score,
                                        out_of: list.question.length,
                                        per,
                                      });
                                    }
                                  });
                                }
                              });
                            } else {
                              res.status(404).send({
                                msg: "That student doesn't exist",
                              });
                            }
                          })
                          .catch((err) => {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong4" });
                            throw err;
                          });
                      });
                    } else {
                      res.status(404).send({
                        msg: "This exam is meant for a group you're not in",
                      });
                    }
                  })
                  .catch((err) => {
                    res.status(500).send({ msg: "Something went wrong5" });
                    throw err;
                  });
              } else if (list.grouped && !list.group_id) {
                res.status(400).send({
                  msg: "No group provided",
                });
              } else {
                answer().then(() => {
                  question_list.forEach((q) => {
                    failed.push({
                      question: list.question[q]._id.toString(),
                      option: null,
                    });
                  });
                  Student.findOne({
                    _id: student_id,
                  })
                    .then((stud) => {
                      if (stud) {
                        stud.examScore.unshift({
                          id: _id,
                          name: list.name,
                          score,
                          failed,
                          createdAt: new Date(),
                        });
                        stud.save((err, newScore) => {
                          if (err) {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong6" });
                            throw err;
                          } else if (newScore) {
                            let toPer = (score / list.question.length) * 100;
                            let per = toPer.toFixed(2);
                            let per_check = per.toString().split(".");
                            if (per_check[1] == "00") {
                              per = parseInt(per_check[0], 10);
                            }
                            if (go_on.WRITER) {
                              list.writers.filter((w, n) => {
                                if (w.id == student_id) {
                                  list.writers[n].score = score;
                                  return true;
                                }
                              });
                            } else {
                              list.makers_score.filter((w, n) => {
                                if (w.id == student_id) {
                                  list.makers_score[n].score = score;
                                  return true;
                                }
                              });
                            }
                            list.save((err, savedE) => {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong7",
                                });
                                throw err;
                              } else if (savedE) {
                                res.send({
                                  score,
                                  out_of: list.question.length,
                                  per,
                                });
                              }
                            });
                          }
                        });
                      } else {
                        res.status(404).send({
                          msg: "The student provided was not found",
                        });
                      }
                    })
                    .catch((err) => {
                      res.status(500).send({ msg: "Something went wrong8" });
                      throw err;
                    });
                });
              }
            }
          });
        } else {
          res.status(404).send({
            msg:
              "The exam isn't available to you. You may consider getting it or wait for your results",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "No such exam",
        });
        // throw err;
      });
  }
};

exports.deleteQuestion = function (req, res) {
  const { _id, question_id, student_id } = req.body;
  if (!_id || !question_id || !student_id) {
    res.status(500).send({ msg: "Something went wrong5" });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            for (let i = 0; i < exam.question.length; i++) {
              var q = exam.question[i];
              if (question_id == q._id) {
                if (student_id == q.owner) {
                  var list = exam.question;
                  list.splice(i, 1);
                  exam.question = list;
                  if (exam.avg_duration) {
                    exam.duration = exam.avg_duration * exam.question.length;
                  }
                  for (let sp = 0; sp < exam.makers.length; sp++) {
                    let mk = exam.makers[sp];
                    if (student_id == mk.id) {
                      exam.makers[sp].question = mk.question - 1;
                      if (
                        exam.makers[sp].question == 0 &&
                        mk.id != exam.author_id
                      ) {
                        const MAKERS = exam.makers.filter(
                          (e) => e.id != student_id
                        );
                        exam.makers = MAKERS;
                      }
                      break;
                    }
                  }
                  if (exam.question.length === 0) {
                    Exam.deleteOne({ _id }, (err, del) => {
                      if (err) {
                        res.status(500).send({ msg: "Something went wrong4" });
                      } else if (del) {
                        NewsFeed.deleteOne({ feed_id: _id })
                          .then((exams) => {
                            res.send({
                              msg: "Exam deleted",
                            });
                          })
                          .catch((err) => {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong3" });
                          });
                      }
                    });
                  } else {
                    exam.save((err, newExam) => {
                      if (err) {
                        res.status(500).send({ msg: "Something went wrong2" });
                      } else if (newExam) {
                        res.send(newExam);
                      }
                    });
                  }
                } else {
                  res.status(403).send({
                    msg: "You can't delete that question",
                  });
                }
                break;
              } else if (i == exam.question.length - 1) {
                res.status(500).send({
                  msg:
                    "Question doesn't exist, may have being deleted or you're not the owner. Check your connection, refresh the page and try again",
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong1" });
        throw err;
      });
  }
};

exports.updateQuestion = function (req, res) {
  const { _id, question_id, newQuestion, student_id } = req.body;
  let option_check = async () => {
    const props = await newQuestion.options.filter((m, n) => {
      if (m.correct) {
        return true;
      }
    });
    return props;
  };

  if (!_id || !question_id || !newQuestion) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    option_check().then((props) => {
      if (props.length > 1 || props.length == 0) {
        res.status(400).send({
          msg: "You are to provide one answer for each question",
          question: newQuestion,
        });
      } else {
        Exam.findOne({ _id })
          .then((exam) => {
            if (exam) {
              if (
                Date.now() >= exam.opensAt &&
                Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
              ) {
                res.status(404).send({
                  msg:
                    "You can't change anything in this exam because the exam has already started",
                });
              } else if (
                Date.now() >
                exam.expiresAt + exam.duration * 60 * 1000
              ) {
                res.status(404).send({
                  msg:
                    "You cant't change anything in this exam because the exam has already ended",
                });
              } else if (Date.now() < exam.opensAt) {
                newQuestion.owner = student_id;
                for (let i = 0; i < exam.question.length; i++) {
                  var question = exam.question[i];
                  if (question_id == question._id) {
                    if (student_id == question.owner) {
                      exam.question[i] = newQuestion;
                      exam.save((err, newSave) => {
                        if (err) {
                          res.status(500).send({ msg: "Something went wrong" });
                        } else if (newSave) {
                          res.send(newSave);
                        }
                      });
                    } else {
                      res.status(400).send({
                        msg: "Couldn't update question",
                      });
                    }
                    break;
                  } else if (i == exam.question.length - 1) {
                    res.status(400).send({
                      msg: "Couldn't update question",
                    });
                  }
                }
              }
            } else {
              res.status(404).send({
                msg: "No such exam",
              });
            }
          })
          .catch((err) => {
            res.status(500).send({ msg: "Something went wrong" });
          });
      }
    });
  }
};

exports.deleteOption = function (req, res) {
  const { _id, question_id, option_id, student_id } = req.body;
  if (!_id || !question_id || !option_id) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            for (let i = 0; i < exam.question.length; i++) {
              var question = exam.question[i];
              if (question_id == question._id) {
                if (student_id == question.owner) {
                  for (let a = 0; a < question.options.length; a++) {
                    var option = question.options[a];
                    if (option_id == option._id) {
                      if (option.correct) {
                        res.status(400).send({
                          msg:
                            "You can't delete the correct option. The correct option text can only be edited",
                        });
                      } else {
                        exam.question[i].options.splice(a, 1);
                        exam.save((err, newSave) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Couldn't delete option",
                            });
                          } else if (newSave) {
                            res.send(newSave);
                          }
                        });
                      }
                      break;
                    } else if (a == exam.question[i].options.length - 1) {
                      res.status(500).send({
                        msg:
                          "The option doesn't exist or may have being deleted. Check your internet connection or refresh the page",
                      });
                    }
                  }
                } else {
                  res.status(500).send({
                    msg:
                      "The question owning the option you're trying to delete doesn't exist or wasn't created by you",
                  });
                }
                break;
              } else if (i == exam.question.length - 1) {
                res.status(500).send({
                  msg: "That question doesn't exist",
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.updateOption = function (req, res) {
  const { _id, question_id, option_id, newOption, student_id } = req.body;
  if (!_id || !question_id || !option_id || !newOption) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            for (let i = 0; i < exam.question.length; i++) {
              var question = exam.question[i];
              if (question_id == question._id) {
                if (student_id == question.owner) {
                  for (let a = 0; a < question.options.length; a++) {
                    var option = question.options[a];
                    if (option_id == option._id) {
                      exam.question[i].options[a].name = newOption;
                      exam.save((err, newSave) => {
                        if (err) {
                          res.status(500).send({ msg: "Something went wrong" });
                        } else if (newSave) {
                          res.send(newSave);
                        }
                      });
                      break;
                    } else if (a == exam.question[i].options.length - 1) {
                      res.status(500).send({
                        msg: "Couldn't find the option to update",
                      });
                    }
                  }
                } else {
                  res.status(500).send({
                    msg:
                      "The question owning the option you're trying to update doesn't exist or wasn't created by you",
                  });
                }
                break;
              } else if (i == exam.question.length - 1) {
                res.status(500).send({
                  msg: "Couldn't find the question",
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.addOption = function (req, res) {
  const { _id, question_id, option, student_id } = req.body;

  if (!_id || !question_id || !option) {
    res.status(400).send({
      msg: "Please fill in the required field(s)",
    });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            for (let i = 0; i < exam.question.length; i++) {
              var q = exam.question[i];
              if (question_id == q._id) {
                if (student_id == q.owner) {
                  if (q.options.length >= 4) {
                    res.status(500).send({
                      msg: "You cannot exceed maximum number of options",
                    });
                  } else {
                    const OPT = exam.question[i].options.filter(
                      (q) => q.correct
                    );
                    if (OPT.length > 0) {
                      if (!option.correct) {
                        exam.question[i].options.push(option);
                        exam.save((err, saved) => {
                          if (err) {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong" });
                          } else if (saved) {
                            res.send(saved);
                          }
                        });
                      } else {
                        res.status(400).send({
                          msg: "Questions are to have just one correct answer",
                        });
                      }
                    } else {
                      exam.question[i].options.push(option);
                      exam.save((err, saved) => {
                        if (err) {
                          res.status(500).send({ msg: "Something went wrong" });
                        } else if (saved) {
                          res.send(saved);
                        }
                      });
                    }
                  }
                } else {
                  res.status(404).send({
                    msg: "Adding option to question unsuccessful",
                  });
                }
                break;
              } else if (i === exam.question.length - 1) {
                res.status(404).send({
                  msg: "Question not found",
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.addQuestions = function (req, res) {
  const { _id, question, student_id } = req.body;

  if (!_id || question.length === 0 || !Array.isArray(question)) {
    res.status(400).send({
      msg: "Please fill in required field(s)",
    });
  } else {
    let verify = async () => {
      await question.forEach((q, n) => {
        question[n].owner = student_id;
      });
    };
    let option_check = async () => {
      const checker = await question.map((q) => {
        return q.options.filter((m, n) => {
          if (m.correct) {
            return true;
          }
        });
      });
      let prop = [];
      await checker.filter((c, n) => {
        if (c.length > 1 || c.length == 0) {
          prop.push(n);
        }
      });
      return prop;
    };
    verify().then(() => {
      option_check().then((props) => {
        if (props.length > 0) {
          const ERROR_QUES = props.map((m) => ({
            question: question[m],
            index: m + 1,
          }));
          res.status(400).send({
            msg: "You are to provide one answer for each of these questions",
            question: ERROR_QUES,
          });
        } else {
          Exam.findOne({ _id })
            .then((exam) => {
              if (exam) {
                if (
                  Date.now() >= exam.opensAt &&
                  Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You can't change anything in this exam because the exam has already started",
                  });
                } else if (
                  Date.now() >
                  exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You cant't change anything in this exam because the exam has already ended",
                  });
                } else if (Date.now() < exam.opensAt) {
                  let list = [];
                  for (let i = 0; i < question.length; i++) {
                    var q = question[i];
                    if (exam.question.length < exam.max_question) {
                      list.push(q);
                    } else if (exam.question.length >= exam.max_question) {
                      break;
                    }
                  }
                  if (list.length === 0) {
                    res.status(400).send({
                      msg:
                        "None of your questions were added. It appears that the maximum number of questions have being reached",
                    });
                  } else if (list.length > 0) {
                    let allow = false;
                    let quickAllow = async () => {
                      const co_auth = await exam.author1_id.filter(
                        (e) => e.id == student_id
                      );
                      if (student_id == exam.author_id || co_auth.length > 0) {
                        allow = true;
                      }
                    };
                    quickAllow().then(() => {
                      if (allow) {
                        list.forEach((m) => {
                          exam.question.push(m);
                        });
                        if (exam.avg_duration) {
                          exam.duration =
                            exam.avg_duration * exam.question.length;
                        }
                        for (let sp = 0; sp < exam.makers.length; sp++) {
                          let mk = exam.makers[sp];
                          if (student_id == mk.id) {
                            console.log(list.length, "this is the length");
                            exam.makers[sp].question =
                              mk.question + list.length;
                            break;
                          } else if (sp === exam.makers.length - 1) {
                            console.log(list.length, "this is the length2");
                            exam.makers.push({
                              id: student_id,
                              question: list.length,
                            });
                            break;
                          }
                        }
                        exam.save((err, saved) => {
                          if (err) {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong2" });
                            throw err;
                          } else if (saved) {
                            let msg;
                            if (list.length === question.length) {
                              msg =
                                "All your questions were added successfully";
                            } else {
                              msg = `Only ${list.length} of your questions were added. This is because the maximum number of questions has being reached`;
                            }
                            res.send({
                              saved,
                              msg,
                            });
                          }
                        });
                      } else if (!allow) {
                        res.status(400).send({
                          msg:
                            "You are not permitted to add questions to this exam",
                        });
                      }
                    });
                  }
                }
              } else {
                res.status(404).send({
                  msg: "No such exam",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({ msg: "Something went wrong1" });
              throw err;
            });
        }
      });
    });
  }
};

// exports.adminSendQuestions = function(req, res) {
//   const { _id, student_id, exam_id, question } = req.body;
//   if (!_id || !student_id || !exam_id || question.length === 0) {
//     res.status(500).send({ msg: "Something went wrong" });
//   } else {
//     for (let aaa = 0; aaa < question.length; aaa++) {
//       var myques = question[aaa].owner;
//       if(!myques || myques == undefined){
//         res.status(404).send({
//           msg:"No owner was provided for your questions"
//         })
//         break
//       }else if(aaa === question.length-1){
//         Group.findOne({
//           _id,
//           "members":{
//             $elemMatch:{
//                 name_id:student_id,
//                 admin:true
//             }
//           }
//         })
//       .then(group => {
//         if (group) {
//           Exam.findOne({ _id: exam_id })
//             .then(exam => {
//               if (exam) {
//                 if (
//                   Date.now() >= exam.opensAt &&
//                   Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
//                 ) {
//                   res.status(404).send({
//                     msg:
//                       "You can't change anything in this exam because the exam has already started"
//                   });
//                 } else if (
//                   Date.now() >
//                   exam.expiresAt + exam.duration * 60 * 1000
//                 ) {
//                   res.status(404).send({
//                     msg:
//                       "You cant't change anything in this exam because the exam has already ended"
//                   });
//                 } else if (Date.now() < exam.opensAt) {
//                   let allow = false
//                   for (let add = 0; add < exam.author1_id.length; add++) {
//                     let co_auth = exam.author1_id[add];
//                     if(!exam.addAble && (student_id == exam.author_id || student_id == co_auth)){
//                       allow = true
//                       break
//                     }else if(exam.addAble){
//                       allow = true
//                       break;
//                     }
//                   }

//                   if(allow){
//                     let arr = [];
//                   for (let a = 0; a < question.length; a++) {
//                     var q = question[a];
//                     arr.push(q);
//                     if (a === question.length - 1) {
//                       let diff = exam.max_question - exam.question.length;
//                       if (diff === 0) {
//                         arr = [];
//                       } else if (diff >= arr.length) {
//                           exam.question.push(arr)
//                       } else if (diff < arr.length) {
//                         arr.length.splice(diff, arr.length - diff)
//                           exam.question.push(arr)
//                       } if(exam.avg_duration){
//                         exam.duration = avg_duration * exam.question.length;
//                       }

//                       if(avg_duration){
//                         exam.duration =
//                         avg_duration * exam.questions.length
//                       }
//                       for (let sp = 0; sp < exam.makers.length; sp++) {
//                         let mk = exam.makers[sp];
//                         if(student_id == mk.id){
//                           exam.makers[sp].question = mk.question + list.length
//                           break
//                         }else if (sp === exam.makers.length-1){
//                           exam.makers.push({
//                             id:student_id,
//                             question:list.length
//                           })
//                         }
//                       }
//                       exam.save((err, saved) => {
//                         if (err) {
//                           res
//                             .status(500)
//                             .send({ msg: "Something went wrong" });
//                         } else if (saved) {
//                           res.send(saved);
//                         }
//                       });
//                     }
//                   }
//                   }else if(!allow){
//                     res.status(500).send({
//                       msg:"You're not permitted to add questions to this exam"
//                     })
//                   }
//                 }
//               } else {
//                 res.status(404).send({
//                   msg: "No such exam"
//                 });
//               }
//             })
//             .catch(err => {
//               res.status(500).send({ msg: "Something went wrong" });
//             });
//         } else {
//           res.status(400).send({
//             msg: "You are not allowed to add questions"
//           });;
//         }
//       })
//       .catch(err => {
//         res.status(500).send({ msg: "Something went wrong" });
//       });
//       }
//     }
//   }
// };

exports.editExamDetails = function (req, res) {
  const {
    _id,
    group_id,
    student_id,
    name,
    category,
    section,
    max_count,
    avg_duration,
  } = req.body;
  var duration = parseInt(req.body.duration, 10);
  var opensAt = parseInt(req.body.opensAt, 10);
  var expiresAt = parseInt(req.body.expiresAt, 10);
  if (
    !_id ||
    !name ||
    !opensAt ||
    !expiresAt ||
    !student_id ||
    !category ||
    !section ||
    !max_count ||
    !duration
  ) {
    res.status(400).send({
      msg: "Please fill the required field(s)",
    });
  } else {
    Student.findOne({ _id: student_id })
      .then((student) => {
        if (student) {
          Exam.findOne({ _id })
            .then((exam) => {
              if (exam) {
                // let = exam.interest.map(qm=>(qm.id))
                if (exam.grouped && avg_duration == undefined) {
                  res.status(400).send({
                    msg: "Provide an average duration",
                  });
                } else {
                  if (student_id == exam.author_id) {
                    let name_msg = null;
                    let time_msg = null;
                    let cat_msg = null;
                    let sect_msg = null;
                    let duration_msg = null;
                    if (
                      Date.now() >= exam.opensAt &&
                      Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
                    ) {
                      res.status(404).send({
                        msg:
                          "You can't change anything in this exam because the exam has already started",
                      });
                    } else if (
                      Date.now() >
                      exam.expiresAt + exam.duration * 60 * 1000
                    ) {
                      res.status(404).send({
                        msg:
                          "You cant't change anything in this exam because the exam has already ended",
                      });
                    } else if (Date.now() < exam.opensAt) {
                      if (opensAt > expiresAt) {
                        res.status(400).send({
                          msg:
                            "Exams cannot expire earlier than they're meant to start",
                        });
                      } else if (opensAt < Date.now()) {
                        res.status(400).send({
                          msg: "Exams cannot start earlier than the moment",
                        });
                      } else {
                        if (avg_duration) {
                          duration = avg_duration * exam.question.length;
                        }
                        console.log(exam.name, "whattt?");
                        console.log(name, "whatttmmm?");
                        console.log(exam.name != name, "whatttmmmjrw?");
                        if (exam.name != name) {
                          name_msg = `The name of the exam "${exam.name}" created by "${exam.author}" has being changed to "${name}"`;
                        }
                        // console.log(((exam.opensAt != opensAt) || (exam.expiresAt != expiresAt)),"true or not")
                        if (
                          exam.opensAt != opensAt ||
                          exam.expiresAt != expiresAt
                        ) {
                          let text;
                          {
                            exam.name != name
                              ? (text = " and")
                              : (text = `The exam "${exam.name}"`);
                          }
                          time_msg = `${text} is now scheduled to open on ${new Date(
                            opensAt
                          ).toLocaleString()} and close ${new Date(
                            expiresAt
                          ).toLocaleString()}`;
                        }

                        if (exam.section != section) {
                          sect_msg = `The exam "${name}" created by "${exam.author}" changed the section from "${exam.section}" to "${section}"`;
                        }
                        if (exam.category != category) {
                          // console.log(category, "this is the supposed category")
                          let innerCat_text;
                          {
                            exam.section != section
                              ? (innerCat_text = "and has")
                              : (innerCat_text = `.\nThe exam "${exam.name}"`);
                          }
                          cat_msg = `${innerCat_text} changed the exam category from "${exam.category}" to "${category}" `;
                        }

                        if (exam.duration != duration) {
                          let mins = " minutes";
                          if (exam.duration == 1) {
                            mins = " minute";
                          }
                          if (duration == 1) {
                            mins = " minute";
                          }
                          duration_msg = `The duration of the exam "${name}" created by "${exam.author}" was changed from ${exam.duration}${mins} to ${duration}${mins}`;
                        }
                        let runListFunc = async () => {
                          if (exam.section != section) {
                            Examlist.findOne({
                              section: exam.section,
                              list: {
                                $elemMatch: {
                                  name: exam.category,
                                  exam: {
                                    $elemMatch: { $in: [_id] },
                                  },
                                },
                              },
                            })
                              .then((e) => {
                                if (e) {
                                  // console.log(e, "e")
                                  let runList = async () => {
                                    let ind;
                                    const newL = await e.list.filter(
                                      (ee, n) => {
                                        if (ee.name == exam.category) {
                                          ind = n;
                                          return true;
                                        }
                                      }
                                    );
                                    if (
                                      e.list.length == 1 &&
                                      e.list[0].exams.length == 1
                                    ) {
                                      await Examlist.deleteOne({
                                        section: exam.section,
                                      })
                                        .then((del) => {
                                          listDetails().catch((err) => {
                                            throw err;
                                          });
                                        })
                                        .catch((err) => {
                                          throw err;
                                        });
                                    } else if (
                                      e.list.length > 1 &&
                                      e.list[0].exams.length == 1
                                    ) {
                                      e.list.splice(ind, 1);
                                      await e.save((err, saved) => {
                                        if (err) {
                                          throw err;
                                        } else if (saved) {
                                          listDetails().catch((err) => {
                                            throw err;
                                          });
                                        }
                                      });
                                    } else if (
                                      L.length > 0 &&
                                      e.list[0].exams.length > 1
                                    ) {
                                      let newINDX;
                                      newL.filter((e, n) => {
                                        if (e == _id) {
                                          newINDX = n;
                                          return true;
                                        }
                                      });
                                      e.list[ind].exams.splice(newINDX, 1);
                                      await e.save((err, saved) => {
                                        if (err) {
                                          throw err;
                                        } else if (saved) {
                                          listDetails().catch((err) => {
                                            throw err;
                                          });
                                        }
                                      });
                                    }
                                  };
                                  runList()
                                    .then()
                                    .catch((err) => {
                                      throw err;
                                    });
                                }
                              })
                              .catch((err) => {
                                throw err;
                              });
                            let listDetails = () => {
                              Examlist.findOne({ section })
                                .then((eL) => {
                                  if (eL) {
                                    let eL_Indx;
                                    const ELL = el.list.filter((e, n) => {
                                      if (e.name == category) {
                                        eL_Indx = n;
                                        return true;
                                      }
                                    });
                                    if (ELL.length > 0) {
                                      const ex_el = ELL.exams.filter((e) => {
                                        if (e == _id) {
                                          return true;
                                        }
                                      });
                                      if (ex_el.length == 0) {
                                        eL.list[eL_Indx].exams.push(_id);
                                      }
                                    } else {
                                      eL.list.push({
                                        name: category,
                                        exams: [id],
                                      });
                                    }
                                  } else {
                                    let newEl = new Examlist({
                                      section,
                                      list: [
                                        {
                                          name: category,
                                          exams: [_id],
                                        },
                                      ],
                                    });
                                    newEl.save((err, saved) => {
                                      if (err) {
                                        throw err;
                                      } else if (saved) {
                                        return true;
                                      }
                                    });
                                  }
                                })
                                .catch((err) => {
                                  throw {
                                    msg: "Couldn't add to list",
                                  };
                                });
                            };
                          } else if (
                            exam.category != category &&
                            exam.section == section
                          ) {
                            Examlist.findOne({
                              section: exam.section,
                              "list.name": exam.category,
                            })
                              .then((e) => {
                                if (e) {
                                  let Ln_indx;
                                  const Ln = e.list.filter((ee, n) => {
                                    if (ee.name == category) {
                                      Ln_indx = n;
                                      return true;
                                    }
                                  });

                                  if (e.list.length == 1) {
                                    e.list.splice(0, 1);
                                  }

                                  if (Ln.length == 0) {
                                    e.list.unshift({
                                      name: category,
                                      exams: [_id],
                                    });
                                  } else {
                                    const L_ = Ln.exams.filter(
                                      (ee) => ee == _id
                                    );
                                    if (L_.length == 0) {
                                      e.list[Ln_indx].exams.push(_id);
                                    }
                                  }
                                } else {
                                  Examlist.findOne({
                                    section: exam.section,
                                  })
                                    .then((e) => {
                                      if (e) {
                                        let Ln_indx;
                                        const Ln = e.list.filter((ee, n) => {
                                          if (ee.name == category) {
                                            Ln_indx = n;
                                            return true;
                                          }
                                        });

                                        if (Ln.length == 0) {
                                          e.list.push({
                                            name: category,
                                            exams: [_id],
                                          });
                                        } else {
                                          const L_ = Ln.exams.filter(
                                            (ee) => ee == _id
                                          );
                                          if (L_.length == 0) {
                                            e.list[Ln_indx].exams.push(_id);
                                          }
                                        }
                                      } else {
                                        let newEl = new Examlist({
                                          section: exam.section,
                                          list: [
                                            {
                                              name: category,
                                              exams: [_id],
                                            },
                                          ],
                                        });
                                        newEl.save((err, saved) => {
                                          if (err) {
                                            throw {
                                              msg: "Couldn't save new list",
                                            };
                                          } else if (saved) {
                                            return true;
                                          }
                                        });
                                      }
                                    })
                                    .catch((err) => {
                                      throw {
                                        msg:
                                          "Something went wrong while creating the exam list",
                                      };
                                    });
                                }
                              })
                              .catch((err) => {
                                throw err;
                              });
                          } else {
                            return true;
                          }
                        };

                        runListFunc()
                          .then(() => {
                            Exam.updateOne(
                              { _id },
                              {
                                category,
                                section,
                                name,
                                opensAt,
                                expiresAt,
                                max_count,
                                avg_duration,
                                duration,
                              }
                            )
                              .then((msg) => {
                                let saved_newsFeed = async (
                                  stud_id,
                                  exam_id
                                ) => {
                                  console.log(exam_id, "this is the id");

                                  NewsFeed.findOne({
                                    creator_id: stud_id,
                                    feed_id: exam_id,
                                  })
                                    .then((nf) => {
                                      if (nf) {
                                        // console.log(nf , "nfff")
                                        nf.createdAt = createdAt;
                                        if (
                                          name_msg ||
                                          time_msg ||
                                          sect_msg ||
                                          cat_msg ||
                                          duration_msg
                                        ) {
                                          let msg = [];
                                          if (name_msg || time_msg) {
                                            let MSG1;
                                            if (name_msg && time_msg) {
                                              MSG1 = name_msg + time_msg;
                                            } else if (name_msg && !time_msg) {
                                              MSG1 = name_msg;
                                            } else if (!name_msg && time_msg) {
                                              MSG1 = time_msg;
                                            }
                                            msg.push({
                                              msg: MSG1,
                                            });
                                          }
                                          if (sect_msg || cat_msg) {
                                            let MSG2;
                                            if (sect_msg && cat_msg) {
                                              MSG2 = sect_msg + cat_msg;
                                            } else if (sect_msg && !cat_msg) {
                                              MSG2 = sect_msg;
                                            } else if (!sect_msg && cat_msg) {
                                              MSG2 = cat_msg;
                                            }
                                            msg.push({
                                              msg: MSG2,
                                            });
                                          }
                                          if (duration_msg) {
                                            msg.push({
                                              msg: duration_msg,
                                            });
                                          }
                                          nf.update = true;
                                          nf.upd_msg = msg;
                                        }

                                        nf.save((err, newFeedSave) => {
                                          if (err) {
                                            res.status(500).send({
                                              msg: "Something went wrong1",
                                            });
                                            throw err;
                                          } else if (newFeedSave) {
                                            res.send(newFeedSave);
                                          }
                                        });
                                      } else {
                                        res
                                          .status(500)
                                          .send({
                                            msg: "Didn't save to news feed",
                                          });
                                      }
                                    })
                                    .catch((err) => {
                                      res
                                        .status(500)
                                        .send({ msg: "Something went wrong2" });
                                      throw err;
                                    });
                                };
                                if (exam.grouped) {
                                  Group.findOne({ _id: group_id })
                                    .then((group) => {
                                      if (group) {
                                        if (name_msg || time_msg) {
                                          group.examNotification.unshift({
                                            msg: name_msg + time_msg,
                                            createdAt,
                                          });
                                        }
                                        if (cat_msg || sect_msg) {
                                          group.examNotification.unshift({
                                            msg: sect_msg + cat_msg,
                                            createdAt,
                                          });
                                        }
                                        if (duration_msg) {
                                          group.examNotification.unshift({
                                            msg: duration_msg,
                                            createdAt,
                                          });
                                        }

                                        group.save((err, savedGroup) => {
                                          if (err) {
                                            res.status(500).send({
                                              msg: "Something went wrong3",
                                            });
                                            throw err;
                                          } else if (savedGroup) {
                                            saved_newsFeed(student_id, _id);
                                          }
                                        });
                                      } else {
                                        res.status(400).send({
                                          msg:
                                            "The group you provided doesn't exist",
                                        });
                                      }
                                    })
                                    .catch((err) => {
                                      res.status(500).send({
                                        msg: "Something went wrong4",
                                      });
                                      throw err;
                                    });
                                } else {
                                  name, opensAt, expiresAt, category, section;
                                  avg_duration, saved_newsFeed(student_id, _id);
                                }
                              })
                              .catch((err) => {
                                res
                                  .status(500)
                                  .send({ msg: "Something went wrong6" });
                                throw err;
                              });
                          })
                          .catch((err) => {
                            res.send(err);
                          });
                      }
                    }
                  } else {
                    res.status(400).send({
                      msg:
                        "You can't change the info of this exam because you're not the creator",
                    });
                  }
                }
              } else {
                res.status(404).send({
                  msg: "No such exam",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({
                msg: "Something went wrong7",
              });
              throw err;
            });
        } else {
          res.status(404).send({
            msg: "The exam creator you provided doesn't exist",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong8",
        });
        throw err;
      });
  }
};

exports.publish = function (req, res) {
  const { student_id, _id } = req.body;

  if (!student_id || !_id) {
    res.status(400).send({
      msg: "Something went wrong",
    });
  } else {
    Exam.findOne({
      _id,
      "writers.id": student_id,
    })
      .then((exam) => {
        if (exam) {
          if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            if (!exam.published) {
              let indx;
              const pub = exam.writers.filter((p, n) => {
                if (student_id == p.id) {
                  indx = n;
                  return true;
                }
              });
              if (pub.length > 0) {
                exam.published = true;
                exam.writers.sort((a, b) => b.score - a.score);
                for (let a = 0; a < exam.writers.length; a++) {
                  exam.writers[a].position = a + 1;
                  if (
                    a === exam.writers.length - 1 &&
                    exam.writers[a].position
                  ) {
                    exam.save((err, saved) => {
                      if (err) {
                        res.status(500).send({
                          msg: "Something wentq wrong",
                        });
                      } else if (saved) {
                        Student.findOne({
                          _id: student_id,
                          "examScore.id": _id,
                        })
                          .then((stud) => {
                            if (stud) {
                              let ex_indx;
                              const studExam = stud.examScore.filter((e, n) => {
                                if (e.id == _id) {
                                  ex_indx = n;
                                  return true;
                                }
                              });
                              if (studExam.length > 0) {
                                stud.examScore[ex_indx].position = position;
                                stud.examScore[ex_indx].participant =
                                  exam.writers.length;
                                stud.save((err, saving) => {
                                  if (err) {
                                    res.status(500).send({
                                      msg: "Something went wrong",
                                    });
                                  } else if (saving) {
                                    res.send({
                                      examScore: stud.examScore[ex_indx],
                                    });
                                  }
                                });
                              }
                            } else {
                              res.status(500).send({
                                msg: "You can't get position",
                              });
                            }
                          })
                          .catch((err) => {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          });
                      }
                    });
                  }
                }
              } else {
                res.status(404).send({
                  msg: "You didn't write that exam",
                });
              }
            } else if (exam.published) {
              let pos;
              let ex_pos = exam.writers.filter((e) => {
                if (e.id == student_id) {
                  pos = e.positon;
                  return true;
                }
              });
              if (ex_pos.length > 0) {
                Student.findOne({
                  _id: student_id,
                  "examScore.id": _id,
                })
                  .then((stud) => {
                    if (stud) {
                      let indx_get;
                      const Score = stud.examScore.filter((e, n) => {
                        if (e.id == _id) {
                          indx_get = n;
                          return true;
                        }
                      });
                      if (Score.length > 0) {
                        stud.examScore[indx_get].position = pos;
                        stud.examScore[indx_get].participant =
                          exam.writers.length;
                        stud.save((err, saving) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          } else if (saving) {
                            res.send({
                              examScore: stud.examScore[indx_get],
                            });
                          }
                        });
                      } else {
                        res.status(403).send({
                          msg: "You can't get position for that exam",
                        });
                      }
                    } else {
                      res.status(404).send({
                        msg: "You can't get position for that exam",
                      });
                    }
                  })
                  .catch((err) => {
                    res.status(500).send({
                      msg: "Something went wrong",
                    });
                  });
              } else {
                res.status(403).send({
                  msg: "You didn't write that exam",
                });
              }
            }
          } else {
            var t = exam.expiresAt + exam.duration * 60 * 1000;
            var time = new Date(t);
            res.status(400).send({
              msg: `Results are not ready yet wait till ${time}`,
            });
          }
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};

exports.changePic = function (req, res) {
  const { _id, question_id, student_id, group_id, pic } = req.body;

  if (!_id || !question_id || !pic || typeof pic != "string") {
    res.status(500).send({
      msg: "Something went wrong. Check if you provided any image",
    });
  } else if (group_id && !student_id) {
    res.status(500).send({
      msg: "Something went wrong",
    });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            let indx;
            const qFind = exam.question.filter((f, n) => {
              if (f._id == question_id) {
                indx = n;
                return true;
              }
            });
            if (qFind.length > 0 && qFind[0].owner == student_id) {
              exam.question[indx].pic = pic;
              exam.save((err, saved) => {
                if (err) {
                  res.status(500).send({
                    msg: "Something went wrong",
                  });
                } else if (saved) {
                  res.send(exam);
                }
              });
            } else {
              res.status(400).send({
                msg: "Updating question image failed",
              });
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};

exports.deletePic = function (req, res) {
  const { _id, question_id, student_id, group_id } = req.body;

  if (!_id || !question_id) {
    res.status(500).send({
      msg: "Something went wrong",
    });
  } else if (group_id && !student_id) {
    res.status(500).send({
      msg: "Something went wrong",
    });
  } else {
    Exam.findOne({ _id })
      .then((exam) => {
        if (exam) {
          if (
            Date.now() >= exam.opensAt &&
            Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
          ) {
            res.status(404).send({
              msg:
                "You can't change anything in this exam because the exam has already started",
            });
          } else if (Date.now() > exam.expiresAt + exam.duration * 60 * 1000) {
            res.status(404).send({
              msg:
                "You cant't change anything in this exam because the exam has already ended",
            });
          } else if (Date.now() < exam.opensAt) {
            let indx;
            const qFind = exam.question.filter((f, n) => {
              if (f._id == question_id) {
                indx = n;
                return true;
              }
            });
            if (qFind.length > 0 && qFind[0].owner == student_id) {
              exam.question[indx].pic = null;
              exam.save((err, saved) => {
                if (err) {
                  res.status(500).send({
                    msg: "Something went wrong",
                  });
                } else if (saved) {
                  res.send(exam);
                }
              });
            } else {
              res.status(400).send({
                msg: "Deleting question image failed",
              });
            }
          }
        } else {
          res.status(404).send({
            msg: "No such exam",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};

exports.showInterest = function (req, res) {
  const { _id, exam_id, group_id } = req.body;

  if (!exam_id || _id) {
    res.status(400).send({
      msg: "Incomplete info",
    });
  } else {
    Student.findOne({ _id })
      .then((stud) => {
        if (stud) {
          Exam.findOne({ _id: exam_id })
            .then((exam) => {
              if (exam) {
                if (exam.grouped) {
                  Group.findOne({
                    id: group_id,
                    "members.name_id": _id,
                  })
                    .then((group) => {
                      if (group) {
                        exam.interest.unshift({
                          id: _id,
                        });
                        exam.save((err, saved) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong",
                            });
                          } else if (saved) {
                            res.send({
                              msg: "Success",
                            });
                          }
                        });
                      } else {
                        res.status(404).send({
                          msg: "You're not a member of the group you provided",
                        });
                      }
                    })
                    .catch((err) => {
                      res.status(500).send({
                        msg: "Something went wrong",
                      });
                    });
                } else {
                  exam.interest.unshift({
                    id: _id,
                  });
                  exam.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong",
                      });
                    } else if (saved) {
                      res.send({
                        msg: "Success",
                      });
                    }
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The exam you provided doesn't exist",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({
                msg: "Something went wrong",
              });
            });
        } else {
          res.status(404).send({
            msg: "The student you provided doesn't exist",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};

exports.makers = function (req, res) {
  const { _id, student_id, group_id } = req.body;
  let { maker_id } = req.body;
  let msg;

  if (
    !_id ||
    !student_id ||
    maker_id.length === 0 ||
    !Array.isArray(maker_id)
  ) {
    if (!Array.isArray(maker_id)) {
      res.status(400).send({
        msg: "Not an array",
      });
    } else {
      res.status(400).send({
        msg: "Information incomplete",
      });
    }
  } else {
    Student.findOne({ _id: student_id })
      .then((stud) => {
        if (stud) {
          let maker_count = maker_id.length;
          Exam.findOne({
            _id,
            author_id: student_id,
          })
            .then((exam) => {
              if (exam) {
                if (
                  Date.now() >= exam.opensAt &&
                  Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You can't change anything in this exam because the exam has already started",
                  });
                } else if (
                  Date.now() >
                  exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You cant't change anything in this exam because the exam has already ended",
                  });
                } else if (Date.now() < exam.opensAt) {
                  let author_verify = async (isGroup, group) => {
                    let next = false;
                    if (isGroup) {
                      let authors = await maker_id.filter((a) => {
                        let quiz = group.members.filter(
                          (g) => g.name_id == a.id
                        );
                        if (quiz.length > 0) {
                          return true;
                        }
                      });
                      if (authors.length === maker_id.length) {
                        maker_id = await maker_id.filter((a) => {
                          let new_authors = exam.author1_id.filter(
                            (auth) => auth.id != a.id
                          );
                          if (new_authors.length === exam.author1_id.length) {
                            return true;
                          }
                        });
                        next = true;
                      } else {
                        next = false;
                      }
                    } else {
                      let authors1 = await maker_id.filter((a) => {
                        let quiz = stud.quizMate.filter((g) => g.id == a.id);
                        if (quiz.length > 0) {
                          return true;
                        }
                      });
                      if (authors1.length === maker_id.length) {
                        maker_id = await maker_id.filter((a) => {
                          let new_authors = exam.author1_id.filter(
                            (auth) => auth.id != a.id
                          );
                          if (new_authors.length === exam.author1_id.length) {
                            return true;
                          }
                        });
                        next = true;
                      } else {
                        console.log(next);
                        next = false;
                      }
                    }
                    return next;
                  };
                  if (exam.grouped) {
                    Group.findOne({ _id: group_id })
                      .then((group) => {
                        author_verify(true, group).then((next) => {
                          if (!next) {
                            res.status(400).send({
                              msg:
                                "Please ensure that all the co-creators you selected are members of your group",
                            });
                          } else {
                            if (maker_id.length > 0) {
                              maker_id.forEach((m) => {
                                exam.author1_id.push({
                                  id: m,
                                });
                              });
                            }
                            if (maker_count == maker_id.length) {
                              msg = "Co-creators added successfully";
                            } else {
                              if (maker_id.length === 0) {
                                msg =
                                  "None of your selected were added. All of the selected were already co-creators";
                              } else {
                                let diff = maker_count - maker_id.length;
                                msg = `Only ${maker_id.length} of your selected individuals was/were added as co-creators because ${diff} of your selected were already co-creators`;
                              }
                            }
                            exam.save((err, saved) => {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong",
                                });
                              } else if (saved) {
                                res.send({
                                  msg,
                                });
                              }
                            });
                          }
                        });
                      })
                      .catch((err) => {
                        res.status(500).send({
                          msg: "Couldn't get group",
                        });
                      });
                  } else {
                    author_verify(false).then((next) => {
                      if (!next) {
                        res.status(400).send({
                          msg:
                            "Ensure that all the selected individuals are your quiz-mates",
                        });
                      } else {
                        if (maker_id.length > 0) {
                          maker_id.forEach((m) => {
                            exam.author1_id.push({
                              id: m.id,
                            });
                          });
                        }
                        if (maker_count == maker_id.length) {
                          msg = "Co-creators added successfully";
                        } else {
                          if (maker_id.length === 0) {
                            msg =
                              "None of your selected were added. All of the selected were already co-creators";
                          } else {
                            let diff = maker_count - maker_id.length;
                            msg = `Only ${maker_id.length} of your selected individuals were added as co-creators because ${diff} of your selected were already co-creators`;
                          }
                        }
                        exam.save((err, saved) => {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong4",
                            });
                            throw err;
                          } else if (saved) {
                            res.send({
                              msg,
                            });
                          }
                        });
                      }
                    });
                  }
                }
              } else {
                res.status(403).send({
                  msg: "Co-creator addition operation failed",
                });
              }
            })
            .catch((err) => {
              res.status(500).send({
                msg: "Something went wrong",
              });
            });
        } else {
          res.status(403).send({
            msg: "The author provided doesn't exist",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};

exports.removeMakers = function (req, res) {
  const { _id, student_id, makers } = req.body;

  if (!_id || !student_id || !Array.isArray(makers) || makers.length === 0) {
    res.status(400).send({
      msg: "Info incomplete",
    });
  } else {
    Student.findOne({ _id: student_id })
      .then((stud) => {
        if (stud) {
          Exam.findOne({
            author_id: student_id,
            _id,
          })
            .then((exam) => {
              if (exam) {
                if (
                  Date.now() >= exam.opensAt &&
                  Date.now() <= exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You can't change anything in this exam because the exam has already started",
                  });
                } else if (
                  Date.now() >
                  exam.expiresAt + exam.duration * 60 * 1000
                ) {
                  res.status(404).send({
                    msg:
                      "You cant't change anything in this exam because the exam has already ended",
                  });
                } else if (Date.now() < exam.opensAt) {
                  let remove_func = async () => {
                    const maked = await exam.author1_id.filter((auth) => {
                      let gotten = makers.filter((m) => {
                        if (auth.id != m.id) {
                          return true;
                        }
                      });
                      if (gotten.length === makers.length) {
                        return true;
                      }
                    });
                    const examMakers = await exam.makers.filter((auth) => {
                      let gotten = makers.filter((m) => auth.id != m.id);
                      if (gotten.length === makers.length) {
                        return true;
                      }
                    });
                    console.log(maked, "maked");
                    console.log(examMakers, "examMakers");
                    const QUESTION = await exam.question.filter((q) => {
                      let question_check = makers.filter(
                        (mk) => mk.id != q.owner
                      );
                      if (question_check.length === makers.length) {
                        return true;
                      }
                    });
                    exam.makers = examMakers;
                    exam.author1_id = maked;
                    exam.question = QUESTION;
                    if (exam.avg_duration) {
                      exam.duration = exam.avg_duration * exam.question.length;
                    }
                  };
                  remove_func().then(() => {
                    exam.save((err, saved) => {
                      if (err) {
                        res.status(500).send({
                          msg: "Something went wrong",
                        });
                      } else if (saved) {
                        res.send(saved);
                      }
                    });
                  });
                }
              } else {
                res.status(403).send({
                  msg: "Operation failed. Exam wasn't found",
                });
              }
            })
            .catch((err) => {
              if (err) {
                res.status(500).send({
                  msg: "Something went wrong",
                });
              }
            });
        } else {
          res.status(403).send({
            msg: "Student provided doesn't exist",
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          msg: "Something went wrong",
        });
      });
  }
};
// exam update details for group exam?
// Groups are to add restrictions to posting exams at will. If the visibility is true, anybody can post questions
// else, only admins can post question
// the work of visibility is to make the group visible for joining by anybody.
// admins can delete people, post questions when the group is not visible ***
// We have an issue. Since we need the student ids to be appended to group questions, it would be impossible to ***
// iterate over the questions using the ids as unique as that would make them not. if that would even save at all ***
// To resolve this issue, a new key would be added named 'owner' and it would only be appended to group questions ***
// exam notification rememeeeeer ***
// intersts for exams should be registered ***
