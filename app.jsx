const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//app.use(express.json());


app.listen(4000, function() {
  console.log("Server started on port 4000");
});

mongoose.connect("mongodb://localhost:27017/songDB", { // creating a connection to mongoDB and that to the SongsDB database.
  useNewUrlParser: true  // adding a property to get rid of errors mongoose likes to throw.
});


const songSchema = { // creating a schema for our collection.
  artist: String,
  title: String,
  difficulty: Number,
  level: Number,
  released: String,
  rating: [Number]
};

const Song = mongoose.model("Song", songSchema); // creating a model and specifying our collection


// route to show all songs in the database.

app.get("/songs", function (req, res) { // route with call back function with request and response
    const {page = 1, limit = 4 } = req.query;
    Song.find( function (err, foundSongs) { // inside of this callback we query our database and find all of the documents inside songs collection.
        if(!err) {       
	       var data = []
	       foundSongs.forEach(function(object){
	       data.push({
		 Song_Title: object.title,
		 Artist: object.artist,
		 Released_Date: object.released
		
      });
    });
    res.send(data);
        } else {
            res.send(err)
        }
    }).limit(limit * 1).skip((page-1)*limit);
})


// showing all songs with difficulty level and optional parameter of SongLevel

app.get("/songs/avg/difficulty/:songLevel?",function(req, res){
    if(req.params.songLevel){
       Song.find({level: req.params.songLevel}, function(err, foundSongs){
       if (foundSongs) {
               var diff = []
	       foundSongs.forEach(function(object){
	       diff.push({
		 Song_Title: object.title,
		 Artist: object.artist,
		  Level: object.level		 
	});
    });
      res.send(diff);
    } else {
      res.send("No level matching that was found.");
    }
  });
  }else{  
       Song.find(function(err, foundSongs){
       if (foundSongs) {
                var diff = []
	       foundSongs.forEach(function(object){
	       diff.push({
		 Song_Title: object.title,
		 Artist: object.artist,
		 Average_Difficulty: object.difficulty
	});
    });
		 res.send(diff)
    } else {
      res.send("average difficulty is not defined.");
    }
  });
  }
})

// For search operation either taking into account song's title or artist name.

app.get("/songs/search/:search",function(req, res){
	Song.find({$or:[{artist: { $regex: new RegExp("^" + req.params.search , "i")}}, {title: { $regex: new RegExp("^" + req.params.search , "i")}}]} , function(err, foundSongs){
	if(foundSongs){
	   var songSearch = []
	       foundSongs.forEach(function(object){
	       songSearch.push({
		 Song_Title: object.title,
		 Artist: object.artist,
		 Average_Difficulty: object.difficulty,
		 Level: object.level
	});
    });
	    res.send(songSearch);
	}
	else{
	    res.send("search not found." + err);
	}
   });
})

// Post request for adding rating to the songs with parameter as the songs_id.

app.post("/songs/:id", function(req, res)
	{
         Song.findByIdAndUpdate({ _id: req.params.id}, {"$push": req.body,},{upsert:true}, function(err){ // body parser will parse the request and pick out the field that find ID and updates with a push operation to database that have the new value.
           if (!err){
           	
               res.send("Successfully added the rating.");
        } else {
               res.send(err);
        }
    });
})

// returning average, the lowest and the highest.

app.get ("/songs/rating/:id", function(req, res)
        {
           var id = req.params.id;
           Song.aggregate([ {$match:{_id: new mongoose.Types.ObjectId(id)}},{$project: { averageRating: {$ceil: {$avg: "$rating"}}, minRating: { $min: "$rating" }, maxRating: { $max: "$rating" }}}],
function(err, foundSongs){
           if(!err){
             res.send(foundSongs);
           }else {
               res.send(err);
        }
      });
})


