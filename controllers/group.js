var Exam = require("../models/exam");
var Group = require("../models/group");
var Student = require("../models/student");
let createdAt = new Date()

exports.createGroup = function(req, res) {
  const { _id, name, description } = req.body;
  if (!_id || !name) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Student.findOne({ _id })
      .then(stud => {
        if (stud) {
          var group = new Group({
            name,
            description,
            creator: _id,
            createdAt,
            members: [
              {
                name_id: _id,
                photo: stud.profilePic,
                name: stud.fullname,
                admin: true
              }
            ]
          });
          group.save((err, saved) => {
            if (err) {
              res.status(500).send({ msg: "Something went wrong" });
            } else if (saved) {
              stud.group.unshift({
                name_id: saved._id,
                name: saved.name,
                visibility: saved.visibility,
                private: saved.private
              });
              stud.save((err, savingStud) => {
                if (err) {
                  res.status(500).send({ msg: "Something went wrong" });
                } else if (savingStud) {
                  res.send(group);
                }
              });
            }
          });
        } else if (!stud || stud == null || stud == undefined) {
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

exports.groupGet = function(req, res) {
  Group.find({})
    .then(group => {
      if (group.length > 0) {
        res.send(group);
      } else {
        res.status(404).send({
          msg: "No group was found"
        });
      }
    })
    .catch(err => {
      res.status.send({
        msg: "Something went wrong"
      });
    });
};

exports.getGroup = function(req, res) {
  const { student_id } = req.body;

  if (!student_id) {
    res.status(400).send({
      msg: "Date incomplete"
    });
  } else {
    Student.findOne({ _id: student_id })
      .then(stud => {
        if (stud) {
          let notif = [];
          let found = [];
          if (stud.group.length > 0) {
            for (let i = 0; i < stud.group.length; i++) {
              let my_group = stud.group[i];
              gettingGroup = async () => {
                await Group.findOne({
                  _id: my_group.name_id,
                  "members.name_id": student_id
                }).then(group => {
                  if (!group || group == undefined || group == null) {
                    if (stud.examScore.length > 0) {
                      const ignore = stud.examScore.filter(
                        scores => my_group.name_id != scores.id
                      );
                      stud.examScore = ignore;
                    }
                    toConfirm();
                    toConfirm = async () => {
                      await Group.findOne({}).then(grp => {
                        if (!grp || grp == undefined || group == null) {
                          notif.push({
                            msg: `The group '${my_group.name}' has being deleted`,
                            createdAt: null
                          });
                        }
                      });
                    };
                  } else if (group) {
                    found.push({
                      visibility: group.visibility,
                      private: group.private,
                      name_id: group._id,
                      name: group.name
                    });
                    let prv = ` is now private`;
                    let vis = ` Requests to the group are now considered by admins before approval`;
                    if (
                      group.name != my_group.name &&
                      group.visibility == my_group.visibility &&
                      group.private == my_group.private
                    ) {
                      if (student_id != group.creator) {
                        notif.push({
                          msg: `The group '${my_group.name}' changed their name to '${group.name}'`,
                          group_id: my_group.group_id,
                          createdAt
                        });
                      }
                      stud.group[i].name = group.name;
                    }

                    if (
                      group.name == my_group.name &&
                      group.visibility != my_group.visibility &&
                      group.private == my_group.private &&
                      student_id != group.creator
                    ) {
                      if (group.visibility == true) {
                        vis =
                          " Anybody can now join the group without admin approval";
                      }
                      notif.push({
                        msg:
                          `The group '${group.name}' changed their visibility status.` +
                          vis,
                        group_id: my_group.group_id,
                        createdAt
                      });
                      stud.group[i].visibility = group.visibility;
                    }

                    if (
                      group.name == my_group.name &&
                      group.visibility == my_group.visibility &&
                      group.private != my_group.private &&
                      student_id != group.creator
                    ) {
                      if (group.private == false) {
                        prv = " is now public.";
                      } else {
                        prv = " is now private";
                      }
                      notif.push({
                        msg: `The group '${group.name}'` + prv,
                        group_id: my_group.group_id,
                        createdAt
                      });
                      stud.group[i].private = group.private;
                    }

                    if (
                      group.name != my_group.name &&
                      group.visibility != my_group.visibility &&
                      group.private == my_group.private &&
                      student_id != group.creator
                    ) {
                      if (group.visibility == true) {
                        vis =
                          " Anybody can now join the group freely without  admin approval";
                      }
                      notif.push({
                        msg:
                          `The group '${my_group.name}' changed their name to '${group.name}' and also their visibility status.` +
                          vis,
                        group_id: my_group.group_id,
                        createdAt
                      });
                      stud.group[i].name = group.name;
                      stud.group[i].visibility = group.visibility;
                    }
                    if (
                      group.name != my_group.name &&
                      group.private != my_group.private &&
                      student_id != group.creator
                    ) {
                      if (group.private == true) {
                        prv = " The group is now private";
                      } else {
                        prv = " The group is now public";
                      }
                      notif.push({
                        msg:
                          `The group '${my_group.name}' changed their name to '${group.name}' and also their privacy status.` +
                          prv,
                        group_id: my_group.group_id,
                        createdAt
                      });
                      stud.group[i].name = group.name;
                      stud.group[i].private = group.private;
                    }
                  }
                });
              };
              gettingGroup().then(() => {
                if (i === stud.group.length - 1) {
                  if (notif.length > 0) {
                    for (n in notif) {
                      stud.groupNotification.unshift(notif[n]);
                    }
                  }

                  stud.group = found;
                  stud.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong1"
                      });
                      throw err;
                    } else if (saved) {
                      res.send(stud.group);
                    }
                  });
                }
              });
            }
          } else {
            res.status(400).send({
              msg:
                "The student hasn't joined a group yet. This is where recommendation comes in"
            });
          }
        } else if (!stud || stud == undefined || stud == null) {
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
exports.addMembersToGroup = function(req, res) {
  const { _id, members, student_id } = req.body;
  if (!_id || members.length === 0) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Group.findOne({ _id })
      .then(group => {
        if (group) {
          console.log(typeof createdAt);
          if (group.visibility) {
            for (let i = 0; i < members.length; i++) {
              let checked = true;
              for (let xx = 0; xx < group.members.length; xx++) {
                var z = group.members[xx];
                if (members[i] == z.name_id) {
                  checked = false;
                  if (i === members.length - 1 && !checked) {
                    let num = group.members.length;
                    group.num = num;
                    group.save((err, saved) => {
                      if (err) {
                        res.status(500).send({ msg: "Something went wrong1" });
                      } else if (saved) {
                        res.send(saved);
                      }
                    });
                  }
                  break;
                } else if (xx === group.members.length - 1 && checked) {
                  Student.findOne({ _id: members[i] }, (err, stud) => {
                    if (stud) {
                      group.members.push({
                        name_id: members[i],
                        name: stud.fullname,
                        photo: stud.profilePic
                      });
                      stud.group.unshift({
                        name_id: _id,
                        name: group.name,
                        visibility: group.visibility,
                        private: group.private
                      });
                      console.log(typeof Date.now());
                      stud.groupNotification.unshift({
                        msg: `You were added to the group '${group.name}'`,
                        group_id: _id,
                        createdAt
                      });
                      stud.save((err, savedStud) => {
                        console.log(Date.now());
                        if (i === members.length - 1) {
                          if (err) {
                            res.status(500).send({
                              msg: "Something went wrong3"
                            });
                            console.log(err);
                            throw err;
                          } else if (savedStud) {
                            let num = group.members.length;
                            group.num = num;
                            group.save((err, saved) => {
                              if (err) {
                                res
                                  .status(500)
                                  .send({ msg: "Something went wrong1" });
                              } else if (saved) {
                                res.send(saved);
                              }
                            });
                          }
                        }
                      });
                    } else {
                      if (i === members.length - 1) {
                        let num = group.members.length;
                        group.num = num;
                        group.save((err, saved) => {
                          if (err) {
                            res
                              .status(500)
                              .send({ msg: "Something went wrong1" });
                          } else if (saved) {
                            res.send(saved);
                          }
                        });
                      }
                    }
                  });
                  break;
                }
              }
            }
          } else {
            for (let a = 0; a < group.members.length; a++) {
              var mem = group.members[a];
              if (student_id == mem.name_id && members.admin) {
                for (let i = 0; i < members.length; i++) {
                  for (let xx = 0; xx < group.members.length; xx++) {
                    var z = group.members[xx];
                    if (members[i] == z.name_id) {
                      checked = false;
                      break;
                    } else if (
                      xx === group.members.length - 1 &&
                      checked == true
                    ) {
                      Student.findOne({ _id: members[i] }, (err, stud) => {
                        if (stud) {
                          group.members.push({
                            name_id: members[i],
                            name:stud.fullname,
                            photo: stud.profilePic
                          });
                          stud.group.unshift({
                            name_id: _id,
                            name: group.name,
                            visibility: group.visibility,
                            private: group.private
                          });
                          stud.groupNotification.unshift({
                            msg: `You were added to the group '${group.name}'`,
                            group_id: _id,
                            createdAt
                          });
                          stud.save((err, savedStud) => {
                            if (i === members.length - 1) {
                              if (err) {
                                res.status(500).send({
                                  msg: "Something went wrong"
                                });
                              } else if (savedStud) {
                                let num = group.members.length;
                                group.num = num;
                                group.save((err, saved) => {
                                  if (err) {
                                    res
                                      .status(500)
                                      .send({ msg: "Something went wrong1" });
                                  } else if (saved) {
                                    res.send(saved);
                                  }
                                });
                              }
                            }
                          });
                        }
                      });
                    }
                  }

                  if (i === members.length - 1) {
                    let num = group.members.length;
                    group.num = num;
                    group.save((err, saved) => {
                      if (err) {
                        res.status(500).send({ msg: "Something went wrong2" });
                      } else if (saved) {
                        res.send(saved);
                      }
                    });
                    break;
                  }
                }
                break;
              } else if (a === group.members.length - 1) {
                res.status(400).send({
                  msg: "Only admins can add members to the group"
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "Group not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong3" });
        throw err;
      });
  }
};

exports.deleteMembersFromGroup = function(req, res) {
  const { _id, members, student_id } = req.body;
  if (!_id || members.length === 0) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    Group.findOne({ _id })
      .then(group => {
        if (group) {
          let alert = "Success";
          for (let mem = 0; mem < group.members.length; m++) {
            var admin = group.members[mem];
            if (student_id == admin.name_id) {
              if (admin.admin) {
                var list = group.members;
                for (let i = 0; i < members.length; i++) {
                  var member = members[i];
                  for (let a = 0; a < group.members.length; a++) {
                    var m = group.members[a];
                    if (member == m.name_id && member != group.creator) {
                      if (m.admin && student_id == group.creator) {
                        list.splice(a, 1);
                        Student.findOne({ _id: members[i] }, (err, stud) => {
                          if (err) {
                            bad += 1;
                            throw err;
                          } else if (stud) {
                            const mygrp = stud.group.filter(g=>(_id != g.name_id))
                            stud.group = mygrp
                            stud.save((err, saved) => {
                              if (err) {
                                bad += 1;
                                throw err;
                              } else if (saved) {
                                message = "success";
                              }
                            });
                          }
                        });
                      } else if (m.admin && student_id != group.creator) {
                        alert =
                          "You were not allowed to delete all your inputs because one or more of the selected members is an admin";
                      } else {
                        list.splice(a, 1);
                        Student.findOne({ _id: members[i] }, (err, stud) => {
                          if (err) {
                            bad += 1;
                            throw err;
                          } else if (stud) {
                            const mygrp1 = stud.group.filter(g=>(_id != g.name_id))
                            stud.group = mygrp1
                            stud.save((err, saved) => {
                              if (err) {
                                bad += 1;
                                throw err;
                              } else if (saved) {
                                message = "success";
                              }
                            });
                          }
                        });
                      }
                    } else if (member == m.name_id && member == group.creator) {
                      alert =
                        "You were not allowed to delete all your inputs because one or more of the selected members is an admin";
                    }
                  }
                  if (i === members.length - 1) {
                    group.members = list;
                    let num = group.members.length;
                    group.num = num;
                    group.save((err, saved) => {
                      if (err) {
                        res.status(500).send({ msg: "Something went wrong" });
                        throw err;
                      } else if (saved) {
                        res.send({
                          group,
                          alert
                        });
                      }
                    });
                    break;
                  }
                }
              } else if (!admin.admin) {
                res.status(400).send({
                  msg: "You're not an admin"
                });
              }
              break;
            } else if (mem === group.members.length - 1) {
              res.status(400).send({
                msg:
                  "You're not a member of the group and so can't delete any member"
              });
              break;
            }
          }
        } else {
          res.status(404).send({
            msg: "Group not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong" });
      });
  }
};

exports.makeAdmins = function(req, res) {
  const { _id, members, student_id } = req.body;
  if (!_id || members.length === 0) {
    res.status(500).send({ msg: "Info incomplete" });
  } else {
    msg = "Success";
    Group.findOne({ _id })
      .then(group => {
        if (group) {
          if (student_id != group.creator) {
            res.send({
              msg: "Only the creator of the group can make members admins"
            });
          } else {
            let count = 0;
            let seen = false;
            for (let i = 0; i < members.length; i++) {
              var member = members[i];
              for (let a = 0; a < group.members.length; a++) {
                var m = group.members[a];
                if (member == m.name_id && member != group.creator) {
                  group.members[a].admin = true;
                  Student.findOne({ _id: member })
                    .then(stud => {
                      if (stud) {
                        stud.groupNotification.unshift({
                          msg: `You were made an admin in the group '${group.name}'`,
                          group_id: _id,
                          createdAt
                        });
                        stud.save((err, savedStud) => {
                          count += 1;
                          if (i === members.length - 1) {
                            seen = true;
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong"
                              });
                            } else if (savedStud) {
                              group.save((err, savedGroup) => {
                                if (err) {
                                  res.status(500).send({
                                    msg: "Something went wrong1"
                                  });
                                } else if (savedGroup) {
                                  if (count === members.length) {
                                    msg =
                                      "All your selected members were successfully made admins";
                                  } else if (
                                    count !== members.length &&
                                    count > 0
                                  ) {
                                    msg = `${count} out of ${members.length} of your selected members were successfully made admins`;
                                  } else if (count === 0) {
                                    msg =
                                      "None of your selected members were made admins";
                                  }
                                  res.send({
                                    msg
                                  });
                                }
                              });
                            }
                          }
                        });
                      }
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong2"
                      });
                    });
                  break;
                }
                if (
                  i === members.length - 1 &&
                  a === group.members.length - 1 &&
                  !seen
                ) {
                  group.save((err, savedGroup) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong1"
                      });
                    } else if (savedGroup) {
                      if (count === members.length) {
                        msg =
                          "All your selected members were successfully made admins";
                      } else if (count !== members.length && count > 0) {
                        msg = `${count} out of ${members.length} of your selected members were successfully made admins`;
                      } else if (count === 0) {
                        msg = "None of your selected members were made admins";
                      }
                      res.send({
                        msg
                      });
                    }
                  });
                  break;
                }
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "Group not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong3" });
        throw err;
      });
  }
};

exports.removeAdmins = function(req, res) {
  const { _id, members, student_id } = req.body;
  if (!_id || members.length === 0) {
    res.status(500).send({ msg: "Something went wrong" });
  } else {
    msg = "Success";
    Group.findOne({ _id })
      .then(group => {
        if (group) {
          if (student_id != group.creator) {
            res.send({
              msg: "Only the creator of the group can remove admins"
            });
          } else {
            let count = 0;
            for (let i = 0; i < members.length; i++) {
              var member = members[i];
              for (let a = 0; a < group.members.length; a++) {
                var m = group.members[a];
                if (member == m.name_id && member != group.creator) {
                  count += 1;
                  group.members[a].admin = false;
                  break;
                }
              }
              if (i === members.length - 1) {
                group.save((err, savedGroup) => {
                  if (err) {
                    res.status(500).send({
                      msg: "Something went wrong1"
                    });
                  } else if (savedGroup) {
                    if (count === members.length) {
                      msg =
                        "All your selected members were successfully removed from the admins' list";
                    } else if (count !== members.length && count > 0) {
                      msg = `${count} out of ${members.length} of your selected members were successfully removed from the admins' list`;
                    } else if (count === 0) {
                      msg =
                        "None of your selected members were removed from the admins' list";
                    }
                    res.send({
                      msg
                    });
                  }
                });
              }
            }
          }
        } else {
          res.status(404).send({
            msg: "Group not found"
          });
        }
      })
      .catch(err => {
        res.status(500).send({ msg: "Something went wrong2" });
      });
  }
};

// exports.makeAllAdmin = function(req, res) {
//   const { _id, student_id } = req.body;

//   if (!id) {
//     res.status(500).send({ msg: "Something went wrong" });
//   } else {
//     Group.findOne({ _id })
//       .then(group => {
//         if (group) {
//           if (student_id != group.creator) {
//             res.send({
//               msg: "Only the creator of the group can make members admins"
//             });
//           } else {
//             group.all_Admin = true;
//             for (let i = 0; i < group.members.length; i++) {
//               group.members[i].admin = true;
//               if (i === group.members.length - 1) {
//                 group.save((err, saved) => {
//                   if (err) {
//                     res.status(500).send({ msg: "Something went wrong" });
//                   } else if (saved) {
//                     res.send(saved);
//                   }
//                 });
//               }
//             }
//           }
//         } else {
//           res.status(404).send({
//             msg: "Group not found"
//           });
//         }
//       })
//       .catch(err => {
//         res.status(500).send({ msg: "Something went wrong" });
//       });
//   }
// };

exports.joinGroup = function(req, res) {
  const { student_id, _id } = req.body;

  if (!student_id || !_id) {
    res.status(400).send({
      msg: "Info incomplete, something went wrong"
    });
  } else {
    Group.findOne({
      _id,
      "members.name_id": { $exists: true, $ne: student_id }
    })
      .then(group => {
        if (group) {
          if (group.visibility) {
            Student.findOne(
              {
                _id: { $exists: true, $in: [student_id] },
                "group.name_id": { $ne: _id }
              },
              (err, stud) => {
                if (err) {
                  res.status(500).send({
                    msg: "Something went wrong7"
                  });
                  throw err;
                } else if (stud) {
                  let rrs = [];
                  if (stud.groupInvites.length > 0) {
                    for (let gpr = 0; gpr < stud.groupInvites.length; gpr++) {
                      let rqg = stud.groupInvites[gpr];
                      let grp_id = rqg.group_id.toString();
                      let _idd = group._id.toString();
                      if (_idd != grp_id) {
                        rrs.push(rqp);
                      }
                    }
                  }

                  group.members.push({
                    name_id: student_id,
                    name:stud.fullname,
                    photo: stud.profilePic
                  });
                  stud.group.unshift({
                    name_id: _id,
                    name: group.name,
                    visibility: group.visibility,
                    private: group.private
                  });

                  stud.groupInvites = rrs;
                  stud.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (saved) {
                      let num = group.members.length;
                      group.num = num;
                      group.save((err, saved) => {
                        if (err) {
                          res.status(500).send({
                            msg: "Something went wrong"
                          });
                        } else if (saved) {
                          res.send({
                            msg: "You've joined the group successfully"
                          });
                        }
                      });
                    }
                  });
                } else if (!stud) {
                  res.status(404).send({
                    msg: "That student is already of that group"
                  });
                }
              }
            );
          } else if (!group.visibility) {
            let joinFunc = async () => {
              await Group.findOne({
                _id: { $exists: true, $in: [_id] },
                "requests.name_id": { $ne: student_id }
              })
                .then(group => {
                  if (group) {
                    Student.findOne({
                      _id: student_id,
                      "group.name_id": { $ne: _id }
                    })
                      .then(stud => {
                        if (stud) {
                          group.requests.unshift({
                            name_id: student_id,
                            name:stud.fullname,
                            photo: stud.profilePic
                          });
                          stud.save((err, saved) => {
                            if (err) {
                              res.status(500).send({
                                msg: "Something went wrong"
                              });
                            } else if (saved) {
                              group.save((err, saved) => {
                                if (err) {
                                  res.status(500).send({
                                    msg: "Something went wrong"
                                  });
                                } else if (saved) {
                                  res.send({
                                    msg: "Request sent successfully"
                                  });
                                }
                              });
                            }
                          });
                        } else if (!stud) {
                          res.status(404).send({
                            msg:
                              "That student is already a member of that group"
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
                      msg: "You have already sent a request to the group"
                    });
                  }
                })
                .catch(err => {
                  res.status(400).send({
                    msg: "Something went wrong"
                  });
                  throw err;
                });
            };
            joinFunc();
          }
        } else {
          res.status(404).send({
            msg: "You're already a member of that group"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong8"
        });
        throw err;
      });
  }
};

exports.acceptRequest = function(req, res) {
  const { requests, _id, admin_id } = req.body;
  let msg = "";

  if (requests.length < 0 || !_id || !admin_id) {
    res.status(400).send({
      msg: "Information incomplete"
    });
  } else {
    Group.findOne({
      _id
    })
      .then(Gps => {
        if (Gps) {
          if(Gps.requests.length > 0){
            for (let i = 0; i < requests.length; i++) {
              var request = requests[i];
              let full = true;
              let passed = 0;
              if (!request.name_id || !request.name || !request.photo) {
                requests.splice(i, 1);
                passed += 1;
                full = false;
              }
              if (full) {
                Group.findOne({
                  _id,
                  "members.name_id": { $exists: true, $ne: request.name_id }
                })
                  .then(group => {
                    if (group) {
                      let findStud = async () => {
                        await Student.findOne({
                          _id: request.name_id,
                          "group.name_id": { $ne: _id }
                        })
                          .then(stud => {
                            if (stud) {
                              let saveFunc = async () => {
                                for (let b = 0; b < group.requests.length; b++) {
                                  let reqq = group.requests[b];
                                  if (request.name_id == reqq.name_id) {
                                    group.members.push({
                                      name_id: request.name_id,
                                      name: request.name,
                                      photo: request.photo
                                    });
                                    group.requests.splice(b, 1);
                                    stud.groupNotification.unshift({
                                      msg: `Your request to join the group '${group.name}' has being accepted. \n You can now see what they post and participate in their exams`,
                                      group_id: _id,
                                      createdAt
                                    });
                                    stud.group.unshift({
                                      name_id: _id,
                                      name: group.name,
                                      visibility: group.visibility,
                                      private: group.private
                                    });
                                    let rrs = [];
                                    if (stud.groupInvites.length > 0) {
                                      for (
                                        let g = 0;
                                        g < stud.groupInvites.length;
                                        g++
                                      ) {
                                        let rq = stud.groupInvites[g];
                                        let grp_id = rq.group_id.toString();
                                        let _idd = group._id.toString();
                                        if (_idd != grp_id) {
                                          rrs.push(rqp);
                                        }
                                      }
                                    }
                                    stud.groupInvites = rrs;
                                    await stud.save((err, savingStud) => {
                                      if (savingStud) {
                                        group.num = group.members.length;
                                        group.save((err, savingGroup) => {
                                          if (i === requests.length - 1) {
                                            if (err) {
                                              res.status(500).send({
                                                msg: "Something went wrong"
                                              });
                                            } else if (savingGroup) {
                                              msg =
                                                "You have successfully added all selected requests to the group";
                                              if (
                                                passed > 1 &&
                                                requests.length !== passed
                                              ) {
                                                msg = `You successfully added ${requests.length -
                                                  passed} out of ${
                                                  requests.length
                                                } selected requests to the group. This may be due to minor issues.`;
                                              } else if (
                                                passed > 1 &&
                                                requests.length === passed
                                              ) {
                                                msg =
                                                  "Non of the selected requests were added. We're currently collecting information of the error. \n Consider deleting the requests and reinviting the individuals";
                                              }
                                              res.send({
                                                msg
                                              });
                                            }
                                          }
                                        });
                                      }
                                    });
                                    break;
                                  } else if (b === group.requests.length - 1) {
                                    passed += 1;
                                    if (i === requests.length - 1) {
                                      msg =
                                        "You have successfully added all selected requests to the group";
                                      if (
                                        passed > 1 &&
                                        requests.length !== passed
                                      ) {
                                        msg = `You successfully added ${requests.length -
                                          passed} out of ${
                                          requests.length
                                        } selected requests to the group. This may be due to minor issues.`;
                                      } else if (
                                        passed > 1 &&
                                        requests.length === passed
                                      ) {
                                        msg =
                                          "Non of the selected requests were added. We're currently collecting information of the error. \n Consider deleting the requests and reinviting the individuals";
                                      }
                                      res.send({
                                        msg
                                      });
                                    }
                                  }
                                }
                              };
                              saveFunc();
                            } else {
                              passed += 1;
                              if (i === requests.length - 1) {
                                msg =
                                  "You have successfully added all selected requests to the group";
                                if (passed > 1 && requests.length !== passed) {
                                  msg = `You successfully added ${requests.length -
                                    passed} out of ${
                                    requests.length
                                  } selected requests to the group. This may be due to minor issues.`;
                                } else if (
                                  passed > 1 &&
                                  requests.length === passed
                                ) {
                                  msg =
                                    "Non of the selected requests were added. We're currently collecting information of the error. \n Consider deleting the requests and reinviting the individuals";
                                }
                                res.send({
                                  msg
                                });
                              }
                            }
                          })
                          .catch(err => {
                            if (i === requests.length - 1) {
                              msg =
                                "You have successfully added all selected requests to the group";
                              if (passed > 1 && requests.length !== passed) {
                                msg = `You successfully added ${requests.length -
                                  passed} out of ${
                                  requests.length
                                } selected requests to the group. This may be due to minor issues.`;
                              } else if (
                                passed > 1 &&
                                requests.length === passed
                              ) {
                                msg =
                                  "Non of the selected requests were added. We're currently collecting information of the error. \n Consider deleting the requests and reinviting the individuals";
                              }
                              res.send({
                                msg
                              });
                            }
                          });
                      };
                      findStud();
                    } else if (!group || group == undefined || group == null) {
                      passed += 1;
                      if (i === requests.length - 1) {
                        msg =
                          "You have successfully added all selected requests to the group";
                        if (passed > 1 && requests.length !== passed) {
                          msg = `You successfully added ${requests.length -
                            passed} out of ${
                            requests.length
                          } selected requests to the group. This may be due to minor issues.`;
                        } else if (passed > 1 && requests.length === passed) {
                          msg =
                            "Non of the selected requests were added. We're currently collecting information of the error. \n Consider deleting the requests and reinviting the individuals";
                        }
                        res.send({
                          msg
                        });
                      }
                    }
                  })
                  .catch(err => {
                    console.log(err);
                  });
              }
            }
          }else{
            res.status(400).send({
              msg:"Nothing to accept"
            })
          }
        } else {
          res.status(404).send({
            msg: "You cant accept requests in that group"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          msg: "Something went wrong"
        });
        throw err;
      });
  }
};

exports.deleteRequest = function(req, res) {
  const { requests, _id } = req.body;

  if (!_id || requests.length == 0) {
    res.send(400).send({
      msg: "Information incomplete"
    });
  } else {
    Group.findOne({ _id })
      .then(group => {
        if (group) {
          if(group.requests.length > 0){
            for (let i = 0; i < requests.length; i++) {
              var request = requests[i];
              let full = true;
              let passed = 0;
              if (!request.name_id) {
                requests.splice(i, 1);
                passed += 1;
                full = false;
              }
              if (full) {
                console.log("n");
                for (let a = 0; a < group.requests.length; a++) {
                  var reqq = group.requests[a];
                  if (request.name_id == reqq.name_id) {
                    group.requests.splice(a, 1);
                    break;
                  } else if (a === group.requests.length - 1) {
                    passed += 1;
                  }
                }
              }
              if (i === requests.length - 1) {
                console.log("n", 1);
                group.save((err, saved) => {
                  if (err) {
                    res.status(500).send({
                      msg: "Something went wrong"
                    });
                  } else if (saved) {
                    let msg = "All selected requests were successfully deleted";
                    if (passed > 0 && passed !== requests.length) {
                      msg = `${passed} out of the ${requests.length} selected requests were deleted. This may be due to minor errors`;
                    } else if (passed > 0 && passed == requests.length) {
                      msg =
                        "None of the selected requests were deleted. This may be due to minor errors";
                    }
                    res.send({
                      msg
                    });
                  }
                });
              }
            }
          }else{
            res.status(400).send({
              msg:"No request to delete"
            })
          }
        } else {
          res.status(404).send({
            msg: "The group provided doesn't exist"
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

exports.groupDetails = function(req, res) {
  const { name, description, student_id, _id } = req.body;

  if (!name || !description || !student_id || !_id) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: student_id })
      .then(stud => {
        if (stud) {
          Group.findOne({ _id })
            .then(group => {
              if (group) {
                if (student_id == group.creator) {
                  group.name = name;
                  group.description = description;
                  group.save((err, saved) => {
                    if (err) {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    } else if (saved) {
                      res.send({
                        msg: "Successfully updated group details"
                      });
                    }
                  });
                } else {
                  res.status(400).send({
                    msg: "Only the creator of the group can edit the group"
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The group you provided doesn't exist"
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

exports.deleteGroup = function(req, res) {
  const { _id, student_id } = req.body;

  if (!_id || !student_id) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: student_id })
      .then(stud => {
        if (stud) {
          Group.findOne({ _id })
            .then(group => {
              if (group) {
                if (student_id == group.creator) {
                  Group.deleteOne({ _id })
                    .then(group => {
                      res.send({
                        msg: group
                      });
                    })
                    .catch(err => {
                      res.status(500).send({
                        msg: "Something went wrong"
                      });
                    });
                } else {
                  res.status(400).send({
                    msg: "Only the creator of the group can delete the group"
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The group you provided doesn't exist"
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

exports.changeVisibility = function(req, res) {
  const { _id, student_id, visibility } = req.body;

  if (
    !_id ||
    !student_id ||
    visibility == undefined ||
    typeof visibility != "boolean"
  ) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: student_id })
      .then(stud => {
        if (stud) {
          Group.findOne({ _id })
            .then(group => {
              if (group) {
                if (student_id == group.creator) {
                  if (group.visibility == visibility) {
                    res.status(400).send({
                      msg: "Nothing to change"
                    });
                  } else {
                    group.visibility = visibility;

                    group.save((err, saved) => {
                      if (err) {
                        res.status(500).send({
                          msg: "Something went wrong"
                        });
                      } else if (saved) {
                        res.send({
                          msg: "Successfully updated group details"
                        });
                      }
                    });
                  }
                } else {
                  res.status(400).send({
                    msg: "Only the creator of the group can delete the group"
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The group you provided doesn't exist"
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

exports.changePrivacy = function(req, res) {
  const { _id, student_id, private } = req.body;
  if (
    !_id ||
    !student_id ||
    private == undefined ||
    typeof private != "boolean"
  ) {
    res.status(400).send({
      msg: "Info incomplete"
    });
  } else {
    Student.findOne({ _id: student_id })
      .then(stud => {
        if (stud) {
          Group.findOne({ _id })
            .then(group => {
              if (group) {
                if (student_id == group.creator) {
                  if (group.private == private) {
                    res.status(400).send({
                      msg: "Nothing to change"
                    });
                  } else {
                    group.private = private;
                    if (private == true) {
                      group.visibility = false;
                    }
                    group.save((err, saved) => {
                      if (err) {
                        res.status(500).send({
                          msg: "Something went wrong"
                        });
                      } else if (saved) {
                        res.send({
                          msg: "Successfully updated group details"
                        });
                      }
                    });
                  }
                } else {
                  res.status(400).send({
                    msg: "Only the creator of the group can delete the group"
                  });
                }
              } else {
                res.status(404).send({
                  msg: "The group you provided doesn't exist"
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

// Find statements in deleteMembersFromGroup are possible bug areas ***
// We've developed further to send notifications to individuals when new exams are created and when group names change, when ***
// they're added to groups ***
// We also thought it helpful to in addition to the id field in the group members array, name (In the format as exam author) ***
// and photo locations be accessible ***
// About yourself and institution path in student model won't also be a bad idea
// Also add course studying
// Remember to add calculator. Courtesy of Ikenna
// Remember to add new routes in profiles file ***
// Use model to re-adjust on group creation and others
// Check if notification messages were appropriately sent
// addMembersToGroup may not be necessary. Please recheck ***
// The change password method to be used would be to send a link to the user's email
// the link would contain the log in  inforamtion and log in the user without the use knowing but wouldnt send
// any other information and from there, the passwrod can be reset.
// Change group description and name ***
// Delete group ***
