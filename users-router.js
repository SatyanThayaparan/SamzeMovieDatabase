const express = require('express');
const path = require('path');
const users = require("./users.json");
const reviews = require("./reviews.json");
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


router.get("/*", auth);
router.get("/", queryParser);
router.get("/", loadUsers);
router.get("/", respondUsers);

router.post("/:user", [becomeContributingUser, followUser, getUser, sendSingleUser]);

router.get("/:user", [getUser, sendSingleUser]);
router.get("/:user/moviesWatched", [getUser, queryParserForMovie, loadMovies, sendSingleUserMoviesWatched]);
router.get("/:user/followers", [getUser, sendSingleUserFollowers]);
router.get("/:user/reviews", [getUser, sendSingleUserReviews]);
router.get("/:user/following", [getUser, sendSingleUserFollowing]);
router.post("/",  [queryParser, search, respondUsers]);

/* ----- FUNCTIONS FROM MOVIE ROUTER MADE FOR EACH USER'S MOVIES_WATCHED PAGE ------ */
function queryParserForMovie(req, res, next)
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
    req.movie_qstring = params.join("&");

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
			req.query.movie_page = 1;
        }	
        
		req.query.page = Number(req.query.page);
        if(req.query.page < 1)
        {
			req.query.movie_page = 1;
		}
    }
    catch{
		req.query.movie_page = 1;
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
    let startIndex = (req.query.movie_page-1) * Number(req.query.limit);
    let count = 0;
	let newResult = [];
	
	if(req.user == null)
	{
		res.status.send("Failure... can't find requesting user");
		return;
	}
	

    req.app.locals.db.collection("movies").find({Title: {$in: req.user.movies_watched}}).toArray(function(err, result)
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


function sendSingleUserMoviesWatched(req, res, next){
	res.render("pages/movies_watched", {movies: res.movies, userisLoggedIn: true, qstring: req.movie_qstring, current: req.query.movie_page, user: req.session.user, reqUsername: req.user.username});
    next();



}

/*---- USER ROUTER FUNCTIONS -----*/ 


function search(req, res, next) {

	let startIndex = (req.query.page-1) * Number(req.query.limit);
	let amount = req.query.limit;

	req.app.locals.db.collection("users").find( {username: {$regex: req.body.username, $options: "i"}} ).limit(amount).skip(startIndex).toArray(function(err, result){
		if(err) throw err;
	
		if(result)
		{
			res.users = result;
			next();

		}

		else
		{
			res.redirect('back');
			return; 
			

		}
		
		

	}); 
	
	
}


function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }
    
    next();
}


function becomeContributingUser(req, res, next){
	if(req.body.normalUser == undefined && req.body.contributingUser == undefined) 
	{
		next(); 
		return;
	}

	else
	{
		
		if(req.body.normalUser != undefined)
		{
			req.app.locals.db.collection("users").findOneAndUpdate({username: req.body.normalUser}, {$set: {isContributingUser: false}}, function(err,result){
				if(err) throw err;
				next();
				
			});
		

		}

		else
		{
			req.app.locals.db.collection("users").findOneAndUpdate({username: req.body.contributingUser}, {$set: {isContributingUser: true}}, function(err,result){
				if(err) throw err;
				next();	
			});

		}
	}

	return;




}

function followUser(req, res, next){
	//Get the id parameter

	if(req.body.userToUnfollow != undefined)
	{
		req.app.locals.db.collection("users").updateOne({username: req.body.userToUnfollow}, {$pull: {following: req.params.user}}, { multi: true }, function(err,result){
			if(err) throw err;
			req.app.locals.db.collection("users").updateOne({username: req.params.user}, {$pull: {followers: req.body.userToUnfollow}}, { multi: true }, function(err,result){
				if(err) throw err;
				next(); 
				
			});
		});		
	}

	else 
	{
		req.app.locals.db.collection("users").updateOne({username: req.body.user}, {$addToSet: {following: req.params.user}}, function(err,result){
			if(err) throw err;
			req.app.locals.db.collection("users").updateOne({username: req.params.user}, {$addToSet: {followers: req.body.user}}, function(err,result){
				if(err) throw err;
				next(); 
				
			});
			
		});
	
	}

	return;


}


function getUser(req, res, next){
	//Get the id parameter
	
	let name = req.params.user;

	req.app.locals.db.collection("users").findOne( {username: name}, function(err, result){
		if(err) throw err;
		/*
		basically i want to either load the query or the whole array but limited
		*/
		if(result)
		{
			req.app.locals.db.collection("users").findOne( {username: req.session.user.username}, function(err, newUser){
				
				if(err) throw err;
				req.user = result;
				req.session.user = newUser; 
				next();
				return;
			});
		}
		else
		{
			req.user = null; 
			next();
			return;
		}

		

	}); 

}

function sendSingleUser(req, res, next){
	if(req.user != null)
	{
		let newResult = [];
		
	

		req.app.locals.db.collection("reviews").find( {creator: req.user.username} ).toArray(function(err, result){
			if(err) throw err;
			
			/*
			basically i want to either load the query or the whole array but limited
			*/
			if(result)
			{
				if(result.length > 0)
				{
					
					newResult = result[result.length -1];
				}
				 
				res.render("pages/usersProfile", { reqUser: req.user, userisLoggedIn: true, user: req.session.user, review: newResult});
				next();
				
			}

		}); 
	
		

	}
	
	return;
    
}


function sendSingleUserFollowers(req, res, next){
	if(req.user != null)
	{
		//{ results: { $elemMatch: { $gte: 80, $lt: 85 } } }

		req.app.locals.db.collection("users").find( {following: { $elemMatch: {$regex: req.user.username, $options: "i"} } } ).toArray(function(err, result){ 

			if (err) throw err; 
			
			res.render("pages/followers", {reqUsername: req.user.username, users: result, userisLoggedIn: true, user: req.session.user });
			next();



		});

	}

	return; 
    
}



function sendSingleUserFollowing(req, res, next){
	if(req.user != null)
	{
		req.app.locals.db.collection("users").find( {followers: { $elemMatch: {$regex: req.user.username, $options: "i"} } } ).toArray(function(err, result){ 

			if (err) throw err; 
		
			res.render("pages/followers", {reqUsername: req.user.username, users: result, userisLoggedIn: true, user: req.session.user });
			next();



		});
	}

	return;
    
}

function sendSingleUserReviews(req, res, next){
	if(req.user != null)
	{
		results = []; 
		let userResults =[];

		req.app.locals.db.collection("reviews").find( {} ).toArray(function(err, result){
			if(err) throw err;

			for(let review in result)
			{
				if(result[review].creator === req.user.username)
				{
					results.push(result[review]);
					userResults.push(req.user); 
					
				}
			}

		
			res.render("pages/reviews", { reviews: results, userisLoggedIn: true, users: userResults, user: req.session.user  });
			next();
			

			/*
			basically i want to either load the query or the whole array but limited
			*/


		}); 

	}

	return;
    
}





function queryParser(req, res, next){
	const MAX_USERS = 50;
	
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
			 req.query.limit = 10;
		 }	
		 
		 req.query.limit = Number(req.query.limit);
		 if(req.query.limit > MAX_USERS)
		 { 
			 req.query.limit = MAX_USERS;
		 }
	 }
	 catch{
		 req.query.limit = 10;
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
	 


	if(!req.query.username){
		req.query.username = "*";
	}

	
	next();
}


function loadUsers(req, res, next){

	let startIndex = (req.query.page-1) * Number(req.query.limit);
	let amount = req.query.limit;
	
	
	if(req.query.username == "*")
	{
		req.app.locals.db.collection("users").find( {} ).limit(amount).skip(startIndex).toArray(function(err, result){
			if(err) throw err;
			res.users = result;
			next();
			return;
	
		}); 
	}

	else
	{
		req.app.locals.db.collection("users").find( {username: {$regex: req.query.username, $options: "i"}} ).limit(amount).skip(startIndex).toArray(function(err, result){
			if(err) throw err;
		
			res.users = result;
			next();
			return;
	
		}); 
	

	}
	
  
    
}



function respondUsers(req, res, next){
    res.render("pages/userList", {users: res.users, qstring: req.qstring, current: req.query.page, userisLoggedIn: true,  user: req.session.user })

	next();
}


module.exports = router; 


