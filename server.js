const express = require('express');
const app = express();
const path = require('path');
const flash = require('connect-flash');
const users = require("./users.json");
const reviewModel = require("./reviews.js");
const movieModel = require("./movies.js"); 
const userModel = require("./users.js"); 
const session = require('express-session');
const mc = require("mongodb").MongoClient; 
const personModel = require("./person.js");

let writerArr = personModel.writerArr;
let directorArr = personModel.directorArr;
let actorArr = personModel.actorArr

let movies = movieModel.movies;
let user = userModel.users; 
let reviews = reviewModel.reviews; 

app.use(session({secret: 'hello', cookie: {}}));
// Set public path
app.use(express.static(path.join(__dirname, "../masterServer/public")));
// Set views path
app.set("views", path.join(__dirname, "../masterServer/public/views"));
// Set pug as view engine
app.set("view engine", "pug");

//Require and mount the various routers
//There is one router for each main type of resource

let createPersonRouter = require("./createPerson-router");
app.use("/createPerson",  createPersonRouter);

let createReviewsRouter = require("./createReviews-router");
app.use("/createReviews",  createReviewsRouter);

let createMoviesRouter = require("./createMovies-router");
app.use("/createMovies",  createMoviesRouter);

let moviesRouter = require("./movies-router");
app.use("/movieList", moviesRouter);

let actorsRouter = require("./actors-router.js");
app.use("/actorList", actorsRouter);

let writersRouter = require("./writers-router.js");
app.use("/writerList", writersRouter);

let directorsRouter = require("./directors-router.js");
app.use("/directorList", directorsRouter);

let loginRouter = require("./loginRouter.js");
app.use("/login", loginRouter);

let signUpRouter = require("./signUpRouter.js");
app.use("/signUp", signUpRouter);

let userRouter = require("./users-router.js");
app.use("/users", userRouter);

app.use(flash());
app.use((req, res, next) => {
    res.locals.errors = req.flash("error");
    res.locals.sucesses = req.flash("success");
    next();

}); 

//Respond with home page data if requested
app.get("/", auth, (req, res, next)=> { res.render("pages/index", {userisLoggedIn: true, user: req.session.user}) });
app.get("/logout", logout); 


function auth(req, res, next) {
    if(!req.session.loggedin) {
        res.render("pages/login", {userisLoggedIn: false}); 
        return;
    }
    
    next();
}

// Logout just set the session variable loggedin to false
//  to fail the auth function.
function logout(req, res, next) {
    if(req.session.loggedin) {
        req.session.logged = false;
    }
    res.render("pages/login", {userisLoggedIn: false})
    next(); 
}

mc.connect("mongodb://localhost:27017", function(err, client) {
    if (err) {
        console.log("Error in connecting to database");
        console.log(err);
        return;
    }

    //Set the app.locals.db variale to be the 'data' database
    app.locals.db = client.db("movieDB");
    /*
    app.locals.db.collection("movies").insertMany(movies, function(err,result){
        if(err) throw err;

    }); 

    app.locals.db.collection("users").insertMany(user, function(err,result){
        if(err) throw err;

    }); 

    app.locals.db.collection("reviews").insertMany(reviews, function(err,result){
        if(err) throw err;

    });

    app.locals.db.collection("writers").insertMany(writerArr, function(err,result){
        if(err) throw err;

    }); 

    app.locals.db.collection("directors").insertMany(directorArr, function(err,result){
        if(err) throw err;

    }); 

    app.locals.db.collection("actors").insertMany(actorArr, function(err,result){
        if(err) throw err;

    });
    */

    

    //Start listening
    app.listen(3000);
    console.log("Server listening at http://localhost:3000");
})
