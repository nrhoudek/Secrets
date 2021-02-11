//jshint esversion:6
//require packages
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const findOrCreate = require("mongoose-findorcreate");

//use express
const app = express();

//create public folder, init ejs, allow bodyParser to work correctly
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

//setup express session for passport
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

//initialize passport and make app use it
app.use(passport.initialize());
app.use(passport.session());

//connect to MongoDB through Mongoose
mongoose.connect(process.env.MONGODB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

//Mongoose Account Schema
const userSchema = new mongoose.Schema ({
  username: {type: String, unique: true, sparse: true},
  password: String,
  googleId: String,
  twitterId:String,
  secrets: [String]
});

//schema plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Mongoose Model for User Accounts
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    userProfileURL: process.env.GOOGLE_USERPROFILE_URL
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({googleId: profile.id,}, function (err, user) {
      return cb(err, user);
    });
  }
));

//Twitter autehntication
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL
  },
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({twitterId: profile.id,}, function (err, user) {
      return cb(err, user);
    });
  }
));

//*******.get functions*******
app.get("/", function(req, res){
  res.render("home");
});

//Google Sign-in pages
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

//Twitter Sign-in pages
app.get("/auth/twitter", passport.authenticate("twitter"));

app.get("/auth/twitter/secrets",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secrets": {$ne: null}}, function(err, foundUsers){
    if(err) {
      res.send(err);
    } else {
      if(foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }//end inner if
    }//end outer if/else
  });
});

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }//end if/else
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

//*******.Post functions*******
app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err) {
      res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }//end if/else
  });
});

app.post("/login", function(req, res){
const user = new User({
  username: req.body.username,
  password: req.body.password
});

  req.login(user, function(err){
    if(err){
      res.redirect("/login");
    } else {
        passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }//end if/else
  });

});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      res.send(err);
    } else {
      if(foundUser) {
        foundUser.secrets.push(submittedSecret);
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }//end inner if
    }//end out if/else
  });
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully on port " + port);
});
