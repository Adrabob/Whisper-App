const express = require("express");
const bodyParser = require("body-parser");
const ejs =require("ejs");
const mongoose = require('mongoose');
const md5 = require("md5");
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
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
    email : String,
    password: String 
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) =>{
    res.render("home");
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

app.get("/secrets", (req, res) =>{
  if(req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
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
        console.log(`Example app listening on port ${PORT}`)
      });
    });