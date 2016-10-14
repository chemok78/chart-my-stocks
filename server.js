var express = require("express");

require("dotenv").config({
  silent: true
})

var path = require("path");
//use node.js native path module to work with files and paths

var bodyParser = require("body-parser");
//load bodyParser module to parse incoming request bodies, under req.body

var mongodb = require("mongodb");
//use native mongoDB drive

var ObjectID = mongodb.ObjectID;
//load ObjectID method so we can generate new objectID(using objectId = new ObjectID)

var yahooFinance = require("yahoo-finance");

var STOCKS_COLLECTION = "stocks";

var app = express();
//create an instance of Express app

/*Express Middleware*/

app.use(express.static(__dirname + "/public"));
//use express middleware for serving static files from public folder (relative to public folder)
app.use(bodyParser.json());
//parse all requests as JSON in the app instance

var db;
//global database variable outside of database connection callback to re-use outside of express app

mongodb.MongoClient.connect(process.env.DB_URL, function(err, database) {

  if (err) {

    console.log(err);

    process.exit(1);

  }

  db = database;
  //save global db variable as database instance

  console.log("successfully connected to the database");

  var server = app.listen(process.env.PORT || 8080, function() {

    var port = server.address().port;
    console.log("App is now running on port", port);

  });

  /*RESTFUL API Web services*/

  function handleError(res, reason, message, code) {
    //generic error handling function used by all endpoints

    console.log("ERROR: " + reason);

    res.status(code || 500).json({

      "error": message

    });

  } //function handleError

  /*Routes to get stock data*/

  //stock symbols send from Angular JS front end
  //retrieve data from Yahoo Finance API
  //save data in database
  //send a response: array of data to handle in Angular JS front end
  //bind data to the $scope, show in Highcharts

  app.get("/quotes/", function(req, res) {
  //API to get stock symbols from database, call Yahoo Finance API and return data as JSON object tp front end

    //look in the database and see which stocks are currently set in the database, using Stock Symbols

    var SYMBOLS = [];
    //array of all the stocks to be checked.
    //get the list of stocks from the database

    db.collection(STOCKS_COLLECTION).find({}).toArray(function(err, doc) {
     //look in the database and see which stocks are currently set in the database, using Stock Symbols

      if (err) {

        handleError(res, err.message, "Failed to find stock symbols in database");

      } else {
      //found the symbols in database  

        for (var i = 0; i < doc.length; i++) {
        //create array with only the symbols

          SYMBOLS.push(doc[i].symbol);

        }
        
        var now = new Date();
//get the current Date

var convertDate = function(date){
//function to convert a date to year-month-day format		
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();

}

var nowDate = convertDate(now)
//format the date to year-month-day

var unixDate = now.getTime();
//convert the current date to Unix time

var unixOneYear = unixDate - 157784760000;
//Extract the milliseconds from 5 years 

var dateOneYear = new Date(unixOneYear);
//convert Unix time back to date

var dateOneYearAgo = convertDate(dateOneYear);
//format the date to year-month-day


        yahooFinance.historical({
        //call Yahoo API with symbols array
        //get the data range 1 year ago till today
        
            symbols: SYMBOLS,
            from: dateOneYearAgo,
            to: nowDate
              //get the data from max 1 year back. So from/to must be generated dynamically

          }, function(err, quotes) {

            if (err) {

              handleError(res, err.message, "Failed to find stocks from Yahoo Finance API");

            } else {
            //YAHOO API call was successfull
            
              var series = [ ];
              //series = [{ name: 'AAPL', data: [[91732321, 23.15], [15751761, 24.2567 ]]}, {}, {}]
              //series is an array of objects & data is an array of arrays
              //quotes = {"AAPL": [{}, {}, {}], "GOOGL": [{}, {}, {}]}
              //quotes is an object of objects.
              console.log(quotes['AAPL'][0]);
            
              for (var key in quotes){
              //keys are Apple, Google, Yahoo etc. All of them contain arrays of objects  
              //quotes[key] is an array of objects
     
                  //console.log(quotes[key][0].date);
                
                  var dataSeries = [ ];
                  
                  for(var i=0; i<quotes[key].length; i++){
                    
                    var date = Date.parse(quotes[key][i].date);
                    
                      var object = [date,quotes[key][i].close];
                    
                      dataSeries.push(object);
                    
                  }
                  
                  //console.log(dataSeries);
                
                series.push({
                  
                  name: key,
                  
                  data: dataSeries,
                  
                  tooltip: {
                  
                    valueDecimals: 2
                
                  }
                  
                });
                
                
              }//for loop
              
              //console.log(series);

              res.status(200).json(series);

            }
          }) // yahooFinance.historical

      } //if else


    }); //db.collection(STOCKS_COLLECTION)


  }); // app.get("/quotes/"


}); //mongodb.MongoClient.connect