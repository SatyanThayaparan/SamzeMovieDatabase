Project: 
  Movie Theatre Database

Partners: 
  Satyan Thayaparan and Hamze Elmi

Files Containining and Handling Server Requests 
------------------------------------------------------------
Majority of our files are using GET requests just to be able to dynamically retrieve the information and print it on the site. 
We've implemented a POST request using a search bar form so users can look for any movie or user. 

movies-router.js
actors-router.js
directors-router.js
writers-router.js
login-router.js
signUp-router.js
users-router.js
server.js
createMovies-router.js
createReviews-router.js
createPerson-router.js

Pug Files (Pages and Partials)
------------------------------

        - actorInformation.pug
        - actorList.pug
        - createMovies.pug
        - createPerson.pug
        - createReviews.pug
        - directorInformation.pug
        - directorList.pug
        - followers.pug
        - following.pug
        - index.pug
        - login.pug
        - movieInformation.pug
        - movieList.pug
        - moviesWatched.pug
        - reviews.pug
        - signup.pug
        - updateMovie.pug
        - userList.pug
        - userProfile.pug
        - writerInformation.pug
        - writerList.pug

Install Instructions For Node.js:
---------------------------------
  1. Proceed to https://nodejs.org/en/download/ on your web browser
  2. From the downloads page, select the "LTS" option, and select the "Windows Installer"
  3. Once the node.js wizard is downloaded, run the executable, and follow the Instructions given within the download wizard. 

Other Modules to Download using NPM Install
-------------------------------------------
  When inside the "masterServer" directory, install the following packages using "npm install"
    - express
    - pug
    - connect-flash
    - express-sessions

Initializing the MongoDB
------------------------
  1. Install MongoDB Compass: https://www.mongodb.com/try/download/compass
  2. Open MongoDB Compass and enter a connection string (e.g., mongodb://localhost:27017)
  3. Create a new collection by clicking "Create Collection."
  4. Import JSON File Data by clicking "Add Data" > "Import File" > Select movies.json, users.json, reviews.json
  5. Once JSON files are selected, click "Import" to import data
  6. Verify that the collection to ensure import was successful


Server Instructions
-------------------
  1. Open command prompt, and enter the "masterServer" director that contains all the movieDatabase files
  2. Enter "node server.js" to run the server. 
  3. Copy the link that was printed to the command prompt (http://127.0.0.1:3000)
  4. Enter link into web browser to view webpage



--------------------------------------------------------------------------------------------------------------------------------------------------------
List of files made from Check-In 2
--------------------------------------------------------------------------------------------------------------------------------------------------------

1.userFunctions.js
  This file contains the business logic when it comes to users (More in-depth expalantion of the function within the js file). 
  Functions in this file include: 
    - createNewUser
    - doesUserExist
    - deleteUser
    - becomeAContributingUser
    - followAUser
    - removeFollower
    - removeFollowing
    - searchForUsers
    - searchForAnyUser
    - userLogin
    - watchedAMovie
    - followedAPerson
    - createReview
    - getReview
    - findReview
    - findReviewsForAMovie
    - deleteReview

2.searchMovies.js 
  This file contains the business logic in regards to the search functionality within the webpage (More in-depth expalantion of the function within the js file).
  Functions in this file include:
    - recommendedMovies
    - relativeSearch
    - search
    - makeList
    - writerList
    - actorGenreList
    - iterateList 

3.contributingUser.js
  This file contains the business logic in regards to the functionality that is specifically given for contributing users (More in-depth expalantion of the function within the js file). 
  Functions in this file include:
    - addMovie
    - deleteMovie
    - doesMovieExist

Files Made To Test Business Logic
----------------------------------

1.testing-contributingUser.js
2.test-searchMovies.js
3.test-userFunctions.js

Other Files 
------------
  1.reviews.json
    This file contains a json array of review objects. 
  
  2.users.json 
    This file contains a json array of user objects.
  
  3.movie-data-short.json
    This file contains a small version of the array of movie objects






--------------------------------------------------------------------------------------------------------------------------------------------------------
List of files made from Check-In 1
--------------------------------------------------------------------------------------------------------------------------------------------------------

  1.functions.js
    This file contains all of the javascript that was used to dynamically print the list of actors, writers, directors, and movies onto the screen, while also being able to implement them in a properly formatted way. 
    Functions
    ---------
      - movieList(movies)
        This function looks through the movie js object I created from the movie-data-short.json file and grabs the name, as well as the poster from the movies object. It then 
        dynamically appends columns to a row div that is made in the movieList.html file.
      
      - whichCategory(movies, num)
        This function loops through the movies object and has 3 if statements. When the function is called on the three different html pages (actorList, directorList, writerList)
        it also passes in a number that is used to differentiate which page is calling the function. This way, based off the number, it will grab information specific to the 
        page. 
        
      - makeList(arr, cardDeck, num, x)
        This function is called in the whichCategory function and simply follows the parameters that are set. They follow said parameters depending on what the num value is. The
        rest of the information is there in order to dynamically implements cards (persons) to the card deck

  2.styles.css
    This file contains all the styling that is applied to our pages, including animations as well.
    
  3.index.html
    We plan for this page to be our home page that is accessible to anyone who opens our website, despite having a user account, or contributing account. There is a slide show just showing wait a user review would look like, 
    as well as bootstrap cards that display what we hope will be how each user page be presented. There is also a brief explanation on what a contributing account and user account are.
    
  4.movieList.html
		The content on this page was grabbed dynamically, and it simply has the title of the movie, along with the movie photo right under. The movie photo as an on hover link that
		will redirect you to a page that will provide the movie information in detail 
		
  5.actorList.html
		The content on this page was grabbed dynamically, it has a list of cards, all that contain the actor's name, the movies he's been a part of, and a button to view more 
		information on the actor. The button will redirect you to a person information page that will show more in-depth information
		
  6.directorList.html
		The content on this page was grabbed dynamically, and follows the same functionality has actorList.html
		
  7.writerList.html
		The content on this page was grabbed dynamically, and follows the same functionality as actorList.hhtml
		
  8.movieInformation.html
		This is the page that movieList.html redirects to when the hover link is selected. It provides with a picture of the movie, along with the rating from the sources, and other 
		movie information such as the length, actors, synopsis and more. 
		
  9.personInfo.html
		This page will consist of the name of the person, as well as who follows them, and will direct us to other movies or people related to the person. This page is currently 
		static. 
	
  10.login.html
     This page is an outline similiar to what our log-in/registration page will look like. There are two forms that contain parameters that need to be inputted in order to make an account. This page is static and we 
     have not yet developed the actually users yet. We most likely will have that finished by the next check-up.
     
  11.mockupuser.html
  	 This is a user profile page, it has been made statically. The page displays their profile photo, along with the number of people they follow and and the number of people 
		 who follow them. It also has tabs that will provide a list of movie recommendations, and another one for movies that have been watched. 

Install Instructions For Node.js:
---------------------------------
  1. Proceed to https://nodejs.org/en/download/ on your web browser
  2. From the downloads page, select the "LTS" option, and select the "Windows Installer"
  3. Once the node.js wizard is downloaded, run the executable, and follow the Instructions given within the download wizard. 

Server Instructions
-------------------
  1. Open command prompt, and enter the "main" director that contains all the movieDatabase files
  2. Enter "node server.js" to run the server. 
  3. Copy the link that was printed to the command prompt (http://127.0.0.1:3000)
  4. Enter link into web browser to view webpage


Additional comments to keep in mind: 
------------------------------------

  Bootstrap was implemented to create a carousel that showed how users will soon be able to review in the website
  Material design bootstrap was used to create the logo's animation
  it was grabbed online and  linked using script src
  j query was also used and it was grabbed from online using script src


What we plan on doing for check-in 3:
-------------------------------------------
  - We will be using pug to render our static pages 

  - We will be using express framework for our server.
    -> using express is a must, and it will make handling requests a LOT easier in the future

  - We will be implementing AJAX interactions to modify information on the server from the client
    -> Examples include:
      -> User login
      -> creating a review object
      -> creating a new movie
      -> adding a movie to a user's "movies watched" list
      -> following/unfollowing
      -> etc. 
  
  - We will work on creating JSON REST API that supports these following routes and parameters:
    -> GET/people
      -> We will have to create a json array that will contain every "person" that's within the movies json array
      -> From there, if a certain person is requested, the people json array would be traversed
      -> this is an easier process than if we had to traverse through every single movie object

    -> POST/user
      -> This will be needed when creating a user login 
      -> The post will contain the user's credentials
      -> We would have to check the database to see if the user exists and if their password is correct

    -> As well as working on the other REST API that's required in the project specifications... 





