
const express = require('express');
const path = require('path');
const users = require("./users.json"); 
const flash = require('connect-flash');
const session = require('express-session');


let router = express.Router();

router.use(express.json());
router.use(express.urlencoded({extended: true}));


router.use(flash());
router.use((req, res, next) => {
    res.locals.errors = req.flash("error");
    res.locals.sucesses = req.flash("success");
    next();

}); 


router.get("/", auth, (req, res, next)=> { res.render("pages/signup");}); 
//router.get("/",  (req, res, next)=> { res.render("pages/signup");});
router.post("/", signup);



function auth(req, res, next) {
    if(req.session.loggedin) {
        res.render("pages/index", {userisLoggedIn: false,  user: req.session.user});  //if they already logged in 
        return;
    }
    
    next();
}



function signup(req, res, next) {
   
   let username = req.body.username.toLowerCase();
   let password = req.body.password;
   let isContributingUser = req.body.isContributingUser; 
   let user;



    req.app.locals.db.collection("users").findOne( {username: username}, function(err,result)
    {
        if(err) throw err;

        if(result)
        {
            req.flash("error", "User already exists... try again");
            res.render("pages/signup", { errors: req.flash("error") });
        }

        else 
        {
            user = {username: username, password: password};
            user.followers = [];
            user.following = [];
            user.movies_watched = []; 
            user.reviews = [];
            req.session.loggedin = true;


            if(isContributingUser === "true")
            {
                user.isContributingUser = true; 


                req.app.locals.db.collection("users").insertOne(user, function(err, result) 
                {
                    if(err)
                    {
                        res.status.send("error saving to database.");
                        return; 
                    }

                    req.session.user = result.ops[0];
                    res.render("pages/index", {userisLoggedIn: true, user:  req.session.user});
                    next(); 
                }) 

            }

            else
            {
                user.isContributingUser = false; 
                // users[user.username] = user; 
                req.app.locals.db.collection("users").insertOne(user, function(err, result) 
                {
                    if(err)
                    {
                        res.status.send("error saving to database.");
                        return; 
                    }

                    req.session.user = result.ops[0];
                    res.render("pages/index", {userisLoggedIn: true, user: req.session.user});
                    next(); 

                })

            }

        }

    });
}

module.exports = router; 
