var express = require("express");
var app = express();
var mongoose = require("mongoose");
var config = require("./config/keys");

mongoose
  .connect(config.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Mongo connected on exams..."))
  .catch(err => console.log(err));

var homeHandler = require("./routes/homePage");
var profileHandler = require("./routes/profiles");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", homeHandler);
app.use("/profile", profileHandler);

var PORT = 4000 || process.env.PORT;
app.listen(PORT, () => {
  console.log(`Exams running on port ${PORT}...`);
});
