const express = require('express');
const path = require('path');
const users = require("./users.json");
const reviews = require("./reviews.json");
const movies = require("./movies.json");
const flash = require('connect-flash');
const session = require('express-session');
const { pseudoRandomBytes } = require('crypto');
let router = express.Router();


router.use(express.static(path.join(__dirname, "../masterServer/public")));

router.use(express.json());
router.use(express.urlencoded({extended: true}));


router.use(flash());
router.use((req, res, next) => {
    res.locals.errors = req.flash("error");
    res.locals.sucesses = req.flash("success");
    next();

}); 

router.get("/*", auth, (req, res, next)=> { res.render("pages/createPerson", {userisLoggedIn: true, user: req.session.user}) });
router.post("/", verifyPerson, submitPerson); 

function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }


    

   

    next();

}

function verifyPerson(req,res,next)
{
    let person = req.body.person;

    if(person === "actors")
    {

        req.app.locals.db.collection("actors").findOne({name: req.body.personName}, function(err,result)
        {
            if (err) throw err

            if(result)
            {
                
                req.flash("error", "You already added this person for this category for this movie..");
                res.render("pages/createPerson", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user});
                return;
            }
            else
            {
                next();
            }

        }); 


    }

    else if(person === "directors")
    {
        req.app.locals.db.collection("directors").findOne({name: req.body.personName}, function(err,result)
        {
            if (err) throw err

            if(result)
            {
                
                req.flash("error", "You already added this person for this category for this movie..");
                res.render("pages/createPerson", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user});
                return;
            }
            else
            {
                next();
            }

        }); 


    }


    else
    {
         req.app.locals.db.collection("writers").findOne({name: req.body.personName}, function(err,result)
        {
            if (err) throw err

            if(result)
            {
                
                req.flash("error", "You already added this person for this category for this movie..");
                res.render("pages/createPerson", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user});
                return;
            }
            else
            {
                next();
            }

        }); 


    }
     
    
}





function submitPerson(req, res, next) 
{
    let person = {}; 
    let name = req.body.personName;
    person.name = name;
    person.followers =[];
    person.movie = [];
    let type = req.body.person; 



    

    req.app.locals.db.collection(type).insertOne(person, function(err,result)
    {
        if(err) throw err; 
           
        if(result)
        {
            req.flash("success", "Person Added!");
            res.render("pages/createPerson", { successes: req.flash("success"), userisLoggedIn: true, user: req.session.user });
            return;

        }
        

        else
        {
            return; 
        }

    }); 


    return;




}     


module.exports = router; 