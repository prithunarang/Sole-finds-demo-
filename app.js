require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs")
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const findOrCreate = require('mongoose-findorcreate')
const alert= require('alert')
const app = express();

var i= 1234;


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))
app.set('view engine', 'ejs');

app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/Solefinds');

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    location: String,

});

const lockerSchema = new mongoose.Schema({
    status: String,
    location: String,
    code: Number,
    owner: String,
    ownerid: String,

})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)
const Locker = new mongoose.model("Locker", lockerSchema)


passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });


app.get("/", function(req, res){
    res.render("index")
}
)


app.get("/login", function(req, res){
  
        res.render("signin")
    
}

)

// app.get("/scan", function(req, res){
//     if(req.isAuthenticated()=== true){
//         res.render("scan")
//     } else {
//         res.redirect("/login")
//     }

// })


app.get("/register", function(req, res){
    if(req.isAuthenticated()=== true){
        res.redirect("/home")
    }
        res.render("register")
    
    
}

)

app.get("/add", function(req, res){
    if(req.isAuthenticated()=== true){
        Locker.find({status: "Available"}).then(function(lockers){
            res.render("add_loceker", {
                
                lockers: lockers
            })
        })
    } else {
        res.redirect("/login")

    }
})

app.get("/use_locker/:lockerId", function(req,res){
    var id = req.params.lockerId;
    console.log(id)
    Locker.findOne({_id: id}).then(function(locker){
        console.log(locker)
        locker.status= "Unavailable"
        locker.owner= req.user.username
        locker.ownerid= req.user._id
        locker.save()
        res.redirect("/home")
    })
})

    
app.get("/remove_locker/:lockerId", function(req,res){
    var id = req.params.lockerId;
    console.log(id)
    Locker.findOne({_id: id}).then(function(locker){
        console.log(locker)
        locker.status= "Available"
        locker.owner= "None"
        locker.ownerid= "None"
        locker.save()
        res.redirect("/home")
    })
})



app.get("/home", function(req, res){
    if(req.isAuthenticated()=== true){
        if(req.user._id=== "64d72bc4c099016a3f4024e3"){
            Locker.find().then(function(lockers){
                res.render("vendor", {
                    
                    lockers: lockers
                })
            })


                   
        }else{
            Locker.find({ownerid: req.user._id}).then(function(lockers){
                res.render("dashboard", {
                    name: req.user.username,
                    name1: "logout",
                    lockers: lockers
                })
                })

           
        }

       
    } else {
        res.redirect("/login")
    }
    
})



app.post("/register", function(req, res){
    User.register({username: req.body.username, email: req.body.email, location: req.body.location}, req.body.password, function(err, user){
        if(err){
            console.log(err)
            res.redirect("/register")
        } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home")
            })
        }
    })
})

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function(err){
        if(err){
            console.log(err)
        } else{
         
            passport.authenticate("local")(req, res, function(){
                
                res.redirect("/home")
            })
        }
    })
})

app.get("/logout", function(req, res){
   
        
            req.logout(function(err){
                console.log(err);
            });
            res.redirect("/")
        
   
})

app.get("/create", function(req, res){
    if(req.isAuthenticated()=== true && req.user._id=== "64d72bc4c099016a3f4024e3"){
        res.render("create_locker")
    } else {
        res.redirect("/login")
    }

})

app.post("/create", function(req, res){
    const locker = new Locker({
        status: "Available",
        location: req.body.locker_loc,
        code: i++,
        owner: "None",
        ownerid: "None"
    })
    locker.save()
    res.redirect("/home")
})




app.listen( process.env.PORT || 3000, function(){
    console.log("Server is running at port 3000")
})
