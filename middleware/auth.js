var jwt = require("jsonwebtoken");
var config = require("../config/keys");

function auth(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    if (bearer.length < 2) {
      res.status(400).send({
        msg: "Something went wrong :(",
      });
    } else {
      const Token = bearer[1];

      jwt.verify(Token, config.ExamSecretKey, (err, authData) => {
        if (err) {
          res.status(400).send({
            msg: "Something went wrong during verification",
          });
        } else if (authData) {
          req.user = authData;
          next();
        }
      });
    }
  } else {
    res.status(400).send({
      msg: "No token authorization failed",
    });
  }
}

module.exports = auth;
