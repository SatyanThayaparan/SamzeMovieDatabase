//const config = require("./movies.json");
const express = require('express');
const path = require('path');
const fs = require("fs");
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

//Account Authorization 
router.get("/*", auth);

//for GET /movieList/
router.get("/", queryParser);
router.get("/", loadMovies);
router.get("/", respondMovies);
//POST requests
router.post("/",  [queryParser, search, respondMovies]);

router.get("/:movieName/reviews", sendReviewsForMovie);
//for the url /products/:movieName
router.get("/:movieName", [recommendMovies, getAvgRating, getReviews, sendMovies]);
router.post("/:movieName", [watchOrUnwatchMovie, recommendMovies, getAvgRating, getReviews, sendMovies]);

//router.post("/:movieName/deleteMovie", [deleteMovie, queryParser, loadMovies, respondMovies]);

router.get("/:movieName/updateMovie", getMovie); 
router.post("/:movieName/updateMovie", [checkPeople, updateMovie, queryParser, getAvgRating, getReviews, recommendMovies, sendMovies]);

function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }

    next();
}

function sendReviewsForMovie(req, res, next) {
   
    

    req.app.locals.db.collection("reviews").find( {movie: req.params.movieName } ).toArray(function(err, results) {
    
        if(err) throw err;
        let idArr = [];
        for(i in results)
        {
            idArr.push(results[i].creator);
        }

       
        req.app.locals.db.collection("users").find( {username:  { $in: idArr} } ).toArray(function(err, allUsers){
            if(err) throw err;

            if(allUsers)
            {
                allUsers.sort(function(a, b) {
                    // Sort docs by the order of their username in idArr.
                    return idArr.indexOf(a.username) - idArr.indexOf(b.username);
                });
    
                res.render("pages/reviews", { reviews: results, userisLoggedIn: true, users: allUsers, user: req.session.user  });
                next();

            }


        });

        
        

    }); 

    return; 

}


function getAvgRating(req, res, next) {

    req.app.locals.db.collection("reviews").find( {movie: req.params.movieName } ).toArray(function(err, result) {
    
        if(err) throw err;

        if(result.length>0)
        {
            let sum = 0;
            for(i in result)
            {
               let score = Number(result[i].score.split("/")[0]);
               sum +=score;
            }

            let avg= (sum / result.length);
            let num = avg.toFixed(2);
            let avgRating = num + "/10"; 
            res.rating = avgRating;
            next();
            return; 

        }

        else
        {
            let avgRating = 0 + "/10"; 
            res.rating = avgRating;
            next();
            return; 

        }
  
    }); 
}

function search(req, res, next) {

	let startIndex = (req.query.page-1) * Number(req.query.limit);
	let amount = req.query.limit;

	req.app.locals.db.collection("movies").find( {Title: {$regex: req.body.title, $options: "i"}} ).limit(amount).skip(startIndex).toArray(function(err, result){
		if(err) throw err;
	
		if(result)
		{
			res.movies = result;
			next();

		}

		else
		{
			res.redirect('back');
			return; 
			
		}
	}); 
}

//Parse the query parameters
//limit: integer specifying maximum number of results to send back
//page: the page of results to send back (start is (page-1)*limit)
//name: string to find in product name to be considered a match
//genre: what kind of genre
//director: movie based on director
//actor: movie based on actor
//writer: find movie based on writer
function queryParser(req, res, next)
{

    //Total number that will be allowed for movie limit
    const MAX_PRODUCTS = 50;

	//build a query string to use for pagination later
	let params = [];
	for(prop in req.query){
		if(prop == "page"){
			continue;
		}
		params.push(prop + "=" + req.query[prop]);
	}
    req.qstring = params.join("&");

    //Movie Limit parameter
    try
    {
        if(!req.query.limit)
        {
			req.query.limit = 25;
		}	
		
		req.query.limit = Number(req.query.limit);
        if(req.query.limit > MAX_PRODUCTS)
        { 
			req.query.limit = MAX_PRODUCTS;
		}
    }
    catch{
		req.query.limit = 25;
	}
	
	//Parse page parameter
    try
    {
        if(!req.query.page)
        {
			req.query.page = 1;
        }	
        
		req.query.page = Number(req.query.page);
        if(req.query.page < 1)
        {
			req.query.page = 1;
		}
    }
    catch{
		req.query.page = 1;
    }
    
    //Parse genre parameter
    if(!req.query.genre){
		req.query.genre = "*";
    }
    
    //Parse actor parameter
    if(!req.query.actor){
		req.query.actor = "*";
    }
    
    //Parse director parameter
    if(!req.query.director){
		req.query.director = "*";
	}
    
    //Parse actor parameter
    if(!req.query.writer){
		req.query.writer = "*";
	}
    next();
}

/*
    result: stores all the movies that meet parameters
    startIndex & endIndex: the current movie that should be printed first on the screen

*/
function loadMovies(req, res, next)
{
    let startIndex = (req.query.page-1) * Number(req.query.limit);
    let count = 0;
    let newResult = [];

    req.app.locals.db.collection("movies").find({}).toArray(function(err, result)
    {
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }

        for(let movies in result)
        {  
            let movie = result[movies];
            if(movieMatch(movie, req.query))
            {
                if(count >= startIndex)
                {
                    newResult.push(movie);
                }

                if(newResult.length >= req.query.limit)
                {
                    break;
                }
                count++;
            }
        }
        res.movies = newResult;
        next();
    });
}

/*
    Purpose: Checks if all the query parameters actually exist 
*/
function movieMatch(movie, query)
{
   
    let genreList = [];
    let actorList = [];
    let wList = [];   
    let genreCheck = false; 
    let actorCheck = false;
    let writerCheck = false;
    let directorCheck = query.director == "*" || movie.Director.toLowerCase().includes(query.director.toLowerCase());
    actorGenreList(movie.Genre, genreList);    
    actorGenreList(movie.Actors, actorList);
    writerList(movie.Writer, wList);

    if(query.genre == "*") { genreCheck = true; }
    else
    {
        for(let x = 0; x < genreList.length; x++)
        {
            if(query.genre.toLowerCase() === genreList[x].toLowerCase()) { genreCheck = true; }
        }
    }

    if(query.actor == "*") { actorCheck = true; }
    else
    {
        for(let x = 0; x < actorList.length; x++)
        {
            if(query.actor.toLowerCase().includes(actorList[x].toLowerCase())) { actorCheck = true; }
        }
    }

    if(query.writer == "*") { writerCheck = true; }
    else
    {
        for(let x = 0; x < wList.length; x++)
        {
            if(query.writer.toLowerCase().includes(wList[x].toLowerCase())) { writerCheck = true; }
        }
    }

    return genreCheck && actorCheck && directorCheck && writerCheck;
}

/* Function: writerList
    Purpose: Takes the writers string and gets rid of all the unneccessary excess information 
    Input
    writers - set() holding the writers + excess information
    Return: Newly formatted string
*/
function writerList(writers, list)
{
    let arr = writers.split(',');

    for(let z = 0; z < arr.length; z++)
    {
      let bracket = arr[z].indexOf("(");
      arr[z] = arr[z].slice(0, bracket);
      arr[z] = arr[z].trim();
      list.push(arr[z]);
    }
}

/* Function: actorsList
    Purpose: Takes the actors string and gets rid of all the unneccessary excess space
    Input
    writers - set() holding the actors + excess space
    Return: Newly formatted string
*/
function actorGenreList(actors, list)
{
    let arr = actors.split(',');
    for(let z = 0; z < arr.length; z++)
    {
        arr[z] = arr[z].trim();
        list.push(arr[z]);
    }
}

function respondMovies(req, res, next)
{
    res.render("pages/movieList", {movies: res.movies, userisLoggedIn: true, qstring: req.qstring, current: req.query.page, user: req.session.user});
    next();
} 

function watchOrUnwatchMovie(req, res, next){
	//Get the id parameter
   
	if(req.body.movieUnwatched != undefined)
	{
       
        req.app.locals.db.collection("users").updateOne({username: req.session.user.username}, {$pull: {movies_watched:  req.body.movieUnwatched}}, { multi: true }, function(err,result){
            if(err) throw err;
            next(); 

        });		
    }


	else 
	{
        req.app.locals.db.collection("users").updateOne({username: req.session.user.username}, {$addToSet: {movies_watched: req.body.movieWatched}}, function(err,result){
            if(err) throw err;
            next(); 

        });		
        

    }
   return;
   
}

/*
function deleteMovie(req, res, next)
{
    if(req.body.delete != undefined)
    {
        req.app.locals.db.collection("movies").deleteOne({Title: req.params.movieName}, function(err, result)
        {
            if(err) throw err;
            next();
        });
    }
    return;
}
*/


function getReviews(req, res, next)
{
    req.app.locals.db.collection("users").findOne( {username: req.session.user.username}, function(err, result){
                    
        if(err) throw err;
        if(result)
        {
            
            req.app.locals.db.collection("reviews").find( {movie: req.params.movieName } ).limit(3).toArray(function(err, results) {
    
                if(err) throw err;
                let idArr = [];
                for(i in results)
                {
                    idArr.push(results[i].creator);
                }
        
               
                req.app.locals.db.collection("users").find( {username:  { $in: idArr} } ).toArray(function(err, allUsers){
                    if(err) throw err;
        
                    if(allUsers)
                    {
                        allUsers.sort(function(a, b) {
                            // Sort docs by the order of their username in idArr.
                            return idArr.indexOf(a.username) - idArr.indexOf(b.username);
                        });
        
                        res.thisUser = result; 
                        res.reviews = results;
                        res.userResults = allUsers; 
                        next();
        
                    }
        
        
                });     
            }); 
          
        }
      
    
    }); 
}

function recommendMovies(req, res, next)
{
    let similiarMovie = []
    let counter = 0;
    req.app.locals.db.collection("movies").findOne( {Title: req.params.movieName}, function(err, result)
    {  
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }
        

        let chosenMovie;
        chosenMovie = result;
        let g = [];
        actorGenreList(chosenMovie.Genre, g);
        req.app.locals.db.collection("movies").aggregate([{$sample: {size: 9000}}]).toArray(function(err, result2) 
        {

            if(err)
            {
                
                res.status(500).send("Error reading database.");
                return;
            }
            
            
            for(let x = 0; x < result2.length; x++)
            {
                
                let sameGenre = 0;
                let g2 = [];
                actorGenreList(result2[x].Genre, g2);
                for(let y = 0; y < g.length; y++)
                {
                    for(let z = 0; z < g2.length; z++)
                    {
                        if(g[y] === g2[z])
                        {
                            sameGenre++;
                        }
                    }
                }
                if(g.length == 1 && g2.length <= 2)
                {
                    if(sameGenre  == 1)
                    {
                        similiarMovie.push(result2[x]);
                        counter++;
                    }
                }

                else if(g.length == 2 && g2.length <= 3)
                {
                    if(sameGenre  == 2)
                    {
                        similiarMovie.push(result2[x]);
                        counter++;
                    }
                }
                
                else if(g.length == 3 && g2.length <= 4)
                {
                    if(sameGenre  = 3)
                    {
                        similiarMovie.push(result2[x]);
                        counter++;
                    }
                }

                if(sameGenre  >= 4)
                {
                    similiarMovie.push(result2[x]);
                    counter++;
                }
                if(counter == 5)
                {
                    break;
                    
                }
            }
            res.recommended = similiarMovie;
            next();
            return;
        });
    });
}

function sendMovies(req, res, next)
{
    req.app.locals.db.collection("movies").find({}).toArray(function(err, result)
    {
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }
                
        let mid = req.params.movieName;
        for(let movies in result)
        {
            let movie = result[movies];
            let title = movie.Title;
            let temp = title.replace(/\s/g,'');
            mid = mid.replace(/\s/g,'');
            if(temp === mid)
            {
                let wSet = new Set();;
                let dSet = new Set();;
                let aSet = new Set();;
                let writers = movie.Writer.split(',');
                for(let z = 0; z < writers.length; z++)
                {
                    if( writers[z].includes("("))
                    {
                        let bracket = writers[z].indexOf("(");
                        writers[z] = writers[z].slice(0, bracket);
                        writers[z] = writers[z].trim();
                        wSet.add(writers[z]);
                    }

                    else
                    {
                        writers[z] = writers[z].trim();
                        wSet.add(writers[z]);
                    }
                }
                if(!movie.Director.includes(','))
                {
                    dSet.add(movie.Director);
                }

                else
                {
                    let directors = movie.Director.split(',');
                    for(let z = 0; z < directors.length; z++)
                    {
                        directors[z] = directors[z].trim();
                        dSet.add(directors[z]);
                    }

                }

                let actors = movie.Actors.split(',');
                for(let z = 0; z < actors.length; z++)
                {
                    actors[z] = actors[z].trim();
                    aSet.add(actors[z]);
                }

                res.actors = Array.from(aSet);
                res.directors = Array.from(dSet);
                res.writers = Array.from(wSet);

                res.render("pages/movieInformation", {movie, userisLoggedIn: true, user: req.session.user, user: res.thisUser, reviews: res.reviews, users:  res.userResults, recommended: res.recommended, avgRating: res.rating, actors: res.actors, directors: res.directors, writers: res.writers});
                next();
                return;
                
            }
        }
     
    });
}

function getMovie(req, res, next)
{
    req.app.locals.db.collection("movies").findOne( {Title: req.params.movieName}, function(err, result)
    {  
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }
            
        res.movies = result
        res.render("pages/updateMovie", {movie: res.movies, userisLoggedIn: true, user: req.session.user});
        next();
    });
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

function updateMovie(req, res, next)
{

    req.app.locals.db.collection("movies").findOneAndUpdate( {Title: req.params.movieName},   {$set:
                                                                                        {
                                                                                            Title: req.body.movieTitle, 
                                                                                            Released: req.body.releaseDate,
                                                                                            Rated: req.body.rating,
                                                                                            Runtime: req.body.runtime,
                                                                                            Actors: req.body.actors,
                                                                                            Director: req.body.director,
                                                                                            Writer: req.body.writers,
                                                                                            Genre: req.body.genres,
                                                                                            Plot: req.body.plot,
                                                                                            Language: req.body.language,
                                                                                            Country: req.body.country
                                                                                        }
                                                                                    }, {returnNewDocument : true},
    function(err,result)
    {
        if(err)
        {
            res.status(500).send("Error reading database.");
            return;
        }

        if(result)
        {
            
            req.params.movieName = req.body.movieTitle.trim(); 
            next();
            return;
            

        }

        else
        {
            next();
            return;
        }
        
        
    });

    return;
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;