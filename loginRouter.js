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

router.get("/", auth, (req, res, next)=> { res.render("pages/login"); });

router.post("/", login);



function auth(req, res, next) {
    if(req.session.loggedin) {
        res.render("pages/index", {userisLoggedIn: true,  user: req.session.user});  //if they already logged in 
        return;
    }
    
    next();
}


function login(req, res, next) {

    let username = req.body.username.toLowerCase();
    let password = req.body.password;
    
    req.app.locals.db.collection("users").findOne({username: username}, function(err, result){
        if(err)throw err;

        if(result)
        {
            if(result.password === password)
            {
                req.session.loggedin = true;
                req.session.user = result;
                res.render("pages/index", {userisLoggedIn: true, user: req.session.user});
                next(); 
            }
            else
            {
                req.flash("error", "Not authorized. Invalid password");
                res.render("pages/login", { errors: req.flash("error") });
                return;
            }
        }
        
        else
        {

            req.flash("error", "Not authorized. Invalid username");
            res.render("pages/login", { errors: req.flash("error") });
            return;
        }

    });

   
}

/*
db.collection("users").findOne({username: username}, function(err, result){
        if(err)throw err;

        console.log(result);

        if(result){
            if(result.password === password){
                req.session.loggedin = true;
                req.session.username = username;
                res.status(200).send("Logged in");
            }else{
                res.status(401).send("Not authorized. Invalid password.");
            }
        }else{
            res.status(401).send("Not authorized. Invalid username.");
            return;
        }

    });
*/


module.exports = router; 