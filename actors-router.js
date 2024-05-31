const express = require('express');
const path = require('path');
const fs = require("fs");
let router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended: true}));

router.use(express.static(path.join(__dirname, "../masterServer/public")));

//Account Authorization 
router.get("/*", auth);

//for GET /actorList/
router.get("/", queryParser);
router.get("/", loadActors);
router.get("/", respondActors);

//for the url /products/:actorName
router.get("/:actorName", [loadMovies, sendActors]);
router.post("/",  [queryParser, search, respondActors]);

function auth(req, res, next) {

    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }

    next();
}

function search(req, res, next) {

	let startIndex = (req.query.page-1) * Number(req.query.limit);
	let amount = req.query.limit;
	req.app.locals.db.collection("actors").find( {name: {$regex: req.body.actor, $options: "i"}} ).limit(amount).skip(startIndex).toArray(function(err, result){
		if(err) throw err;
        
		if(result)
		{
			res.actors = result;
			next();

		}

		else
		{
			res.redirect('back');
			return; 
			
		}
	}); 
}

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
			req.query.limit = 10;
		}	
		
		req.query.limit = Number(req.query.limit);
        if(req.query.limit > MAX_PRODUCTS)
        { 
			req.query.limit = MAX_PRODUCTS;
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

    //Parse name parameter
    if(!req.query.name){
		req.query.name = "*";
    }
    next();
}

function loadActors(req, res, next)
{

    let newResult = [];
    let startIndex = (req.query.page-1) * Number(req.query.limit);
    let count = 0;

    req.app.locals.db.collection("actors").find({}).toArray(function(err, result)
    {
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }

    
        for(let actors in result)
        {  
            let actor = result[actors];
            if(req.query.name == "*" || actor.name.toLowerCase().includes(req.query.name.toLowerCase()))
            {
                if(count >= startIndex)
                {
                    newResult.push(actor);
                }

                if(newResult.length >= req.query.limit)
                {
                    break;
                }
                count++;
            }
        }
        res.actors = newResult;
        next();
    });
}

function respondActors(req, res, next)
{
    res.render("pages/actorList", {actors: res.actors, userisLoggedIn: true, qstring: req.qstring, current: req.query.page, user: req.session.user});
    next();
}


function loadMovies(req, res, next)
{
    req.app.locals.db.collection("actors").findOne( {name: req.params.actorName}, function(err, result)
    { 
        let involvedMovies = [];
        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }
        if(result)
        {
            let actor;
            actor = result;
            
            for(let x = 0; x < actor.movie.length; x++)
            {
                let mov = actor.movie[x];
                req.app.locals.db.collection("movies").findOne( {Title: mov}, function(err, movie)
                {  
                    if(err)
                    {                    
                        res.status(500).send("Error reading database.");
                        return;
                    }
                    involvedMovies.push(movie);
                });
            }
            res.movies = involvedMovies;
            next();
        }
        return;
    });
    return;
}


function sendActors(req, res, next)
{
    req.app.locals.db.collection("actors").find({}).toArray(function(err, result)
    {

        if(err)
        {
            res.status(500).send("Error reading database.");
			return;
        }

        for(let actors in result)
        {
            let actor = result[actors];
            let temp = actor.name.replace(/\s/g,'');
            let mid = req.params.actorName;
            mid = mid.replace(/\s/g,'');
            if(temp === mid)
            {
                console.log(mid);
                res.actors = actor;
                res.render("pages/actorInformation", {actor: res.actors, userisLoggedIn: true, user: req.session.user, movies: res.movies});
            }
        }
        next();
    });
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;