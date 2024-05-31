const { json } = require("express");
let movies = require("./movies.json"); 
const { get } = require("./signUpRouter");



function makeList(movies)
{
    let writerJSON = [];
    let directorJSON = [];
    let actorJSON =[]; 

    let writers = new Set();
    let directors = new Set();
    let actors = new Set();
    let films = new Set();
    for(let x = 0; x < movies.length; x++)
    {   
        films.add(movies[x].Title);  
        writerList(movies[x].Writer, writers, writerJSON, movies[x].Title );
        direcList(movies[x].Director, directors, directorJSON, movies[x].Title )
        actorGenreList(movies[x].Actors, actors, actorJSON, movies[x].Title);
    }
    return [writers, directors, actors, writerJSON, directorJSON, actorJSON];
}



function writerList(writers, list, jsonArr, title)
{
    let arr = writers.split(',');
      
    for(let z = 0; z < arr.length; z++)
    {
        if( arr[z].includes("(") )
        {
            let bracket = arr[z].indexOf("(");
            arr[z] = arr[z].slice(0, bracket);
            arr[z] = arr[z].trim();
           
            if(!jsonArr.hasOwnProperty(arr[z]))
            {
                let d = {};
                d.name = arr[z];
                d.movie = []; 
                d.movie.push(title);
                d.followers = [];
                jsonArr[arr[z]] = d; 

            }
          
            else
            {
                if(!jsonArr[arr[z]].movie.includes(title))
                {
                    jsonArr[arr[z]].movie.push((title));
                }

            } 

            list.add(arr[z]);
        }

        else
        {
            arr[z] = arr[z].trim();

            if(!jsonArr.hasOwnProperty(arr[z]))
            {
                let d = {};
                d.name = arr[z];
                d.movie = []; 
                d.movie.push(title);
                d.followers = [];
                jsonArr[arr[z]] = d; 

            }
          
            else
            {
                if(!jsonArr[arr[z]].movie.includes(title))
                {
                    jsonArr[arr[z]].movie.push((title));
                }

            } 


            list.add(arr[z]);
        }

    }

   
}

function direcList(direc, list, jsonArr, title)
{
    if(!direc.includes(','))
    {
        if(!jsonArr.hasOwnProperty(direc))
            {
                let d = {};
                d.name = direc;
                d.movie = []; 
                d.movie.push(title);
                d.followers = [];
                jsonArr[direc] = d; 

            }
          
            else
            {
                if(!jsonArr[direc].movie.includes(title))
                {
                    jsonArr[direc].movie.push((title));
                }

            } 

        list.add(direc);
    }
    else
    {
        let arr = direc.split(',');
        for(let z = 0; z < arr.length; z++)
        {
            arr[z] = arr[z].trim();
            if(!jsonArr.hasOwnProperty(arr[z]))
            {
                let d = {};
                d.name = arr[z];
                d.movie = []; 
                d.movie.push(title);
                d.followers = [];
                jsonArr[arr[z]] = d; 

            }
          
            else
            {
                if(!jsonArr[arr[z]].movie.includes(title))
                {
                    jsonArr[arr[z]].movie.push((title));
                }

            } 
            list.add(arr[z]);
        }

    }
    
}

function actorGenreList(actors, list, jsonArr, title)
{
    let arr = actors.split(',');
    for(let z = 0; z < arr.length; z++)
    {
        arr[z] = arr[z].trim();

        if(!jsonArr.hasOwnProperty(arr[z]))
        {
            let d = {};
            d.name = arr[z];
            d.movie = []; 
            d.movie.push(title);
            d.followers = [];
            jsonArr[arr[z]] = d; 

        }
          
        else
        {
            if(!jsonArr[arr[z]].movie.includes(title))
            {
                jsonArr[arr[z]].movie.push((title));
            }

        } 

        list.add(arr[z]);
    }
}


let getLists = makeList(movies); 
let writers = getLists[0];
let directors = getLists[1];
let actors = getLists[2]; 

let writerJSON = getLists[3];
let directorJSON = getLists[4];
let actorJSON = getLists[5];


let writerArr = [];
let directorArr = [];
let actorArr = []; 

for(i in writerJSON )
{
    writerArr.push(writerJSON[i]);

}

for(i in directorJSON)
{
    directorArr.push(directorJSON[i]);
}

for(i in actorJSON)
{
    actorArr.push(actorJSON[i]);
}


module.exports = {
    writerArr,
    directorArr,
    actorArr
}

