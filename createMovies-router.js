const express = require('express');
const path = require('path');
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

router.get("/*", auth, (req, res, next)=> { res.render("pages/createMovies", {userisLoggedIn: true, user: req.session.user}) });
router.post("/", checkPeople, submitMovie); 

function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }
    
    next();
}

function checkPeople(req, res, next)
{
    /*Bascially this checks if the new movie has any people currently in the db
        if so... then add this movie to their movies array */

   //check actors

   /*
    Actors: req.body.actors,
   Director: req.body.director,
   Writer: req.body.writers,
   */
   let arr = req.body.actors.split(',');
   for(let z = 0; z < arr.length; z++){
       arr[z] = arr[z].trim();

        req.app.locals.db.collection("actors").findOne({name: arr[z]}, function(err, result){
            if(err) throw err;
            if(result)
            {
                console.log(result);
                console.log(result.movie.length);
                if(!result.movie.includes(req.body.movieTitle))
                {
                    req.app.locals.db.collection("actors").updateOne({name: arr[z]}, {$addToSet: {movie: req.body.movieTitle}}, function(err,result){
                        if(err) throw err;
                    });
        
                }
            }

        });
    }


    if(!req.body.director.includes(','))
    {
        req.app.locals.db.collection("directors").findOne({name: req.body.director}, function(err, result){
            if(err) throw err;
            if(result)
            {
                console.log(result.movie.length);
                if(!result.movie.includes(req.body.movieTitle))
                {
                    req.app.locals.db.collection("directors").updateOne({name: req.body.director}, {$addToSet: {movie: req.body.movieTitle}}, function(err,result){
                        if(err) throw err;
                    });
        
                }
            }

        });

    }

    else
    {
        let arr = req.body.director.split(',');
        for(let z = 0; z < arr.length; z++)
        {
            arr[z] = arr[z].trim();
            req.app.locals.db.collection("directors").findOne({name: arr[z]}, function(err, result){
                if(err) throw err;
                if(result)
                {
                    if(!result.movie.includes(req.body.movieTitle))
                    {
                        req.app.locals.db.collection("directors").updateOne({name: arr[z]}, {$addToSet: {movie: req.body.movieTitle}}, function(err,result){
                            if(err) throw err;
                        });
            
                    }
                }
    
            });

        }

    }


    let arr1 = req.body.writers.split(',');
      
    for(let z = 0; z < arr1.length; z++)
    {
        if( arr1[z].includes("(") )
        {
            let bracket = arr1[z].indexOf("(");
            arr1[z] = arr1[z].slice(0, bracket);
            arr1[z] = arr1[z].trim();
            req.app.locals.db.collection("writers").findOne({name: arr1[z]}, function(err, result){
                if(err) throw err;
                if(result)
                {
                    if(!result.movie.includes(req.body.movieTitle))
                    {
                        req.app.locals.db.collection("writers").updateOne({name: arr1[z]}, {$addToSet: {movie: req.body.movieTitle}}, function(err,result){
                            if(err) throw err;
                        });
            
                    }
                }
    
            });
        }

        else
        {
            arr1[z] = arr1[z].trim();
            req.app.locals.db.collection("writers").findOne({name: arr1[z]}, function(err, result){
                if(err) throw err;
                if(result)
                {
                    if(!result.movie.includes(req.body.movieTitle))
                    {
                        req.app.locals.db.collection("writers").updateOne({name: arr1[z]}, {$addToSet: {movie: req.body.movieTitle}}, function(err,result){
                            if(err) throw err;
                        });
            
                    }
                }
    
            });

        }


    }

    next();
    return;
}

function submitMovie(req, res, next)
{
    req.app.locals.db.collection("movies").find( {Title: {$regex: req.body.movieTitle, $options: "i"}}).toArray(function(err, result)
    {
        
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }

        if(result === req.body.movieTitle)
        {
            console.log(result);
            console.log(req.body.movieTitle);
            req.flash("error", "Please enter a movie that is not within the database...");
            res.render("pages/createMovies", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user });
            return;
        }

        if(Number(req.body.runtime < 0))
        {
            req.flash("error", "Please enter a valid Run time value");
            res.render("pages/createMovies", { errors: req.flash("error"), userisLoggedIn: true, user: req.session.user });
            return;
        }
        
        console.log(req.body.released);
        let movie = {};
        movie.Title = req.body.movieTitle;
        movie.Released = req.body.releasedDate;
        movie.Rated = req.body.rating;
        movie.Runtime = req.body.runtime + " min";
        movie.Actors = req.body.actors;
        movie.Director = req.body.director;
        movie.Writer = req.body.writers;
        movie.Genre = req.body.genres;
        movie.Plot = req.body.plot;
        movie.Poster = req.body.poster;
        movie.Language = req.body.language;
        movie.Country = req.body.country;

        req.app.locals.db.collection("movies").insertOne(movie, function(err, result)
        {
            if(err)
            {
                res.status(500).send("Error reading database.");
                return;
            }

            req.flash("success", "Movie Submitted!");
            res.render("pages/createMovies", { successes: req.flash("success"), userisLoggedIn: true, user: req.session.user });
            return;
        });

    });
}

module.exports = router; 