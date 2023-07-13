const express = require("express");
const bodyParser = require("body-parser");
const ejs =require("ejs");
const mongoose = require('mongoose');
const md5 = require("md5");
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();



const app = express();
const PORT = 3000;
const saltRounds = 10;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: "Our secret is secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } 
  catch (error) {
    console.log(error)
    process.exit(1)
  }
}

const userSchema = new mongoose.Schema({

  username:String,

  password:String,

  googleId: String,

  secret: String

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});
 
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});



passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  
  User.findOrCreate({ googleId: profile.id, username: profile.id  }, function (err, user) {

    return cb(err, user);

  });
}
));



app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/auth/google", 
  passport.authenticate("google", {scope: ["profile"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/register", (req, res) =>{
    res.render("register");
});


app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/logout", function(req,res){
  req.logout((err)=>{
      if(err){
          console.log(err);
      }else{
          res.redirect("/");
      }
  });
});

app.get("/secrets",function(req,res){
  User.find({"secret": {$ne: null}})
      .then(function(foundUsers){
          res.render("secrets", {usersWithSecrets:foundUsers});
      })
      .catch((err)=>{
          console.log(err);
      })
});

app.get("/submit", (req, res) =>{
  res.render("submit");
});


app.post("/register", (req, res)=>{
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  });
});


app.post("/submit",function(req,res){
  const submittedSecret= req.body.secret;

  User.findById(req.user.id)
      .then(function(foundUser){
          foundUser.secret=submittedSecret;
          foundUser.save()
              .then(()=>{
                  res.redirect("/secrets");
              });
      })
      .catch((err)=>{
          console.log(err);
      })
});


app.post("/login", (req, res)=>{

 const user = new User({
  username: req.body.username,
  password: req.body.password
 });

 req.login(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets");
  })
}
 })

});


connectDB().then(() =>{
    app.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`);
      });
    })