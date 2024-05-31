const express = require('express');
const path = require('path');
const users = require("./users.json");
const reviews = require("./reviews.json");
const movies = require("./movies.json");
const flash = require('connect-flash');
const session = require('express-session');
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

router.get("/*", auth, (req, res, next)=> { res.render("pages/createReviews", {userisLoggedIn: true, user: req.session.user}) });
router.post("/", verifyReview, submitReview); 

function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }


    

   

    next();

}

function verifyReview(req,res,next)
{
     
    req.app.locals.db.collection("reviews").findOne({creator: req.session.user.username, movie: req.body.movieTitle}, function(err,result)
    {
        if (err) throw err

        if(result)
        {
             
            req.flash("error", "You already made a review for this movie..");
            res.render("pages/createReviews", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user});
            return;
        }
        else
        {
            next();
        }

    }); 

}





function submitReview(req, res, next) 
{

   


    let nextReviewID = -1;

    req.app.locals.db.collection("reviews").findOne({}, {sort:{$natural:-1}}, function(err,result)
    {
        if (err) throw err

        
        nextReviewID = String(Number(result.id) + 1);
        let review = {};
        let verifyScore = "/10";
        let titleOfMovie = req.body.movieTitle;
        let score = req.body.score; 
        let text = req.body.review; 

       

        if(score.indexOf(verifyScore) < 0)
        {
            // (n/10).indexof("/10") should always be 1.
            req.flash("error", "Please enter a valid score. Must be in 'score/10' format");
            res.render("pages/createReviews", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user});
            return;
        } 


        req.app.locals.db.collection("movies").findOne( {Title: { $regex: titleOfMovie, $options: "i" }} , function(err, result)
        {
            if(err) throw err

            if(result)
            {
                review.id = String(nextReviewID);
                review.movie = result.Title;
                review.score = score; 
                review.text = text; 
                review.creator = req.session.user.username; 
                //reviews[review.id] = review;

                req.app.locals.db.collection("reviews").insertOne(review, function(err, result) 
                {
                    if(err)
                    {
                        res.status.send("error saving to database.");
                    }

                    if(result)
                    {
                        req.app.locals.db.collection("users").updateOne({username: req.session.user.username}, {$addToSet: {reviews: nextReviewID}}, function(err,result)
                        {
                            if(err) throw err;
                            req.flash("success", "Review Submitted!");
                            res.render("pages/createReviews", { successes: req.flash("success"), userisLoggedIn: true, user: req.session.user });
                            return;
                        });
                    }



                    
                }); 

            }

            else
            {
                req.flash("error", "Please enter a movie within the database..");
                res.render("pages/createReviews", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user });
                return;

            }


        }); 

       
    }); 

 

    
    return;
}






module.exports = router; 


