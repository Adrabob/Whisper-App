const express = require("express");
const bodyParser = require("body-parser");
const ejs =require("ejs");
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


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

const userSchema ={
    email : String,
    password: String 
};

const User = mongoose.model("User", userSchema);


app.get("/", (req, res) =>{
    res.render("home");
});


app.get("/register", (req, res) =>{
    res.render("register");
});


app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/logout", (req, res) =>{
  res.render("home");
});

app.post("/register", (req, res)=>{

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save()
  .then(function(){
      res.render("secrets");
  })
  .catch(function(err) {
      console.log(err);
    });
});


app.post("/login", (req, res)=>{

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username})
  .then(function(foundUser){
    if(foundUser.password === password){
      res.render("secrets");
    }else{
      res.render("login");
    }
})
.catch(function(err) {
    console.log(err);
  });

});




connectDB().then(() =>{
    app.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`)
      });
    });