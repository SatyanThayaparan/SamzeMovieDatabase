const express = require('express');
const path = require('path');
const fs = require("fs");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
let router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended: true}));
router.use(express.static(path.join(__dirname, "../masterServer/public")));

//Account Authorization 
router.get("/*", auth);

//for GET /directorList/
router.get("/", queryParser);
router.get("/", loadDirectors);
router.get("/", respondDirectors);
router.post("/",  [queryParser, search, respondDirectors]);

//for the url /products/:directorName
router.get("/:directorName", loadMovies, sendDirectors);

function auth(req, res, next) {

  if(!req.session.loggedin) {
      res.render("pages/login", {userisLoggedIn: false}); 
      return;
  }

  next();
}

function search(req, res, next) 
{

	let startIndex = (req.query.page-1) * Number(req.query.limit);
	let amount = req.query.limit;
	req.app.locals.db.collection("directors").find( {name: {$regex: req.body.director, $options: "i"}} ).limit(amount).skip(startIndex).toArray(function(err, result){
		if(err) throw err;
        
		if(result)
		{
			res.directors = result;
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
  for(prop in req.query)
  {
    if(prop == "page")
    {
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
  catch
  {
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

  catch
  {
    req.query.page = 1;
  }

  //Parse name parameter
  if(!req.query.name)
  {
    req.query.name = "*";
  }
  next();
}

function loadDirectors(req, res, next)
{

    let newResult = [];
    let startIndex = (req.query.page-1) * Number(req.query.limit);
    let count = 0;

    req.app.locals.db.collection("directors").find({}).toArray(function(err, result)
    {
        if(err)
        {
            res.status(500).send("Error reading database.");
		      	return;
        }

    
        for(let directors in result)
        {  
          let director = result[directors];
          if(req.query.name == "*" || director.name.toLowerCase().includes(req.query.name.toLowerCase()))
          {
              if(count >= startIndex)
              {
                  newResult.push(director);
              }

              if(newResult.length >= req.query.limit)
              {
                  break;
              }
              count++;
          }
        }
        res.directors = newResult;
        next();
    });
}

function respondDirectors(req, res, next)
{
    res.render("pages/directorList", {directors: res.directors, userisLoggedIn: true, qstring: req.qstring, current: req.query.page, user: req.session.user});
    next();
}

function loadMovies(req, res, next)
{
    req.app.locals.db.collection("directors").findOne( {name: req.params.directorName}, function(err, result)
    { 
      let involvedMovies = [];
      if(err)
      {
        res.status(500).send("Error reading database.");
        return;
      }
      
      if(result)
      {
          let director;
          director = result;
          //console.log(actor);
          for(let x = 0; x < director.movie.length; x++)
          {
              let mov = director.movie[x];
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

function sendDirectors(req, res, next)
{
    req.app.locals.db.collection("directors").find({}).toArray(function(err, result)
    {

        if(err)
        {
            res.status(500).send("Error reading database.");
			      return;
        }

        for(let directors in result)
        {
            let director = result[directors];
            let temp = director.name.replace(/\s/g,'');
            let mid = req.params.directorName;
            mid = mid.replace(/\s/g,'');
            if(temp === mid)
            {
                res.directors = director;
                res.render("pages/directorInformation", {director: res.directors, userisLoggedIn: true, user: req.session.user, movies: res.movies});
            }
        }
        next();
    });
}

//Export the router object, so it can be mounted in the store-server.js file
module.exports = router;