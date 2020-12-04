var express = require("express");
var router = express.Router();

var Home = require("../controllers/exam");

router.get("/", Home.home);

module.exports = router;
