var express = require("express");

require("dotenv").config({
  silent: true
});

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

/*Setup Socket.io*/

var server = require('http').Server(app);

var io = require('socket.io')(server);

io.on('connection', function(socket){
  
   console.log("someone connected!");
   
   socket.on('disconnect', function(){
     
     console.log("someone disconnected!");
     
   })
  
});

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

  /*var server = app.listen(process.env.PORT || 8080, function() {

    var port = server.address().port;
    console.log("App is now running on port", port);

  });*/
  
  server.listen(process.env.PORT || 8080, function(){
    
    console.log("server started!");
    
    
  });
  
   /*Date Parsing to get right format Yahoo API call*/

        var now = new Date();
        //get the current Date

        var convertDate = function(date) {
          //function to convert a date to year-month-day format		
          return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();

        };

        var nowDate = convertDate(now);
          //format the date to year-month-day

        var unixDate = now.getTime();
        //convert the current date to Unix time

        var unixOneYear = unixDate - 94670856000;
        //Extract the milliseconds from 3 years 

        var dateOneYear = new Date(unixOneYear);
        //convert Unix time back to date

        var dateOneYearAgo = convertDate(dateOneYear);
        //format the date to year-month-day

  /*RESTFUL API Web services*/

  function handleError(res, reason, message, code) {
    //generic error handling function used by all endpoints

    console.log("ERROR: " + reason);

    res.status(code || 500).json({

      "error": message

    });

  } //function handleError

  /*Routes to get stock data*/

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
        
        if(SYMBOLS.length == 0){
        //if no stocks at all in database, initiaze the chart with 1 stock 
          
          SYMBOLS.push("AAPL");
          
        }

        yahooFinance.historical({
            //call Yahoo API with symbols array
  
            symbols: SYMBOLS,
            from: dateOneYearAgo,
            to: nowDate
              
          }, function(err, quotes) {

            if (err) {

              handleError(res, err.message, "Failed to find stocks from Yahoo Finance API");

            } else {
              //YAHOO API call was successfull

              var series = [];
              //construct series array (array of objects for each stock) for HighStocks
       
              for (var key in quotes) {
              //quotes is the JSON object returned from the Yahoo API call
              //With an object for each stock

                var dataSeries = [];
                //construct dataSeries object with an array of arrays for each day, used in High Stocks

                for (var i = 0; i < quotes[key].length; i++) {
                //loop through quotes JSON Object for each key/Stock  

                  var date = Date.parse(quotes[key][i].date);

                  var object = [date, quotes[key][i].close];

                  dataSeries.push(object);

                }

                series.push({

                  name: key,

                  data: dataSeries,

                  tooltip: {

                    valueDecimals: 2

                  }

                });


              } //for loop


              res.status(200).json(series);

            }
          }); // yahooFinance.historical

      } 


    }); //db.collection(STOCKS_COLLECTION)


  }); // app.get("/quotes/"
  
  app.get("/addquotes/:query", function(req,res){
  //API called from Angular JS front end with the stock symbol
  
    console.log(req.params.query);

    req.params.query = req.params.query.toUpperCase();
    //convert stock query to Uppercase first for consistency
    
    //check if the stock symbol exists in Yahoo Finance API
    
    yahooFinance.historical({
            //call Yahoo API with symbols array
  
            symbol: req.params.query,
            from: dateOneYearAgo,
            to: nowDate
              
          }, function(err, quotes) {

            if (err) {
              
              handleError(res, err.message, "Failed to find stocks from Yahoo Finance API");

            } else {
              //YAHOO API call was successfull
              
              if(quotes.length === 0){
              //if quotes array is empty, the stock does not exist
              //emit empty array to all clients in Angular Front end, where it will handle the error
              
              io.emit('add', quotes);
          
              
              } else {
              
              //if quotes array is not empty
            
              var dataSeries = [];
                //construct dataSeries object with an array of arrays for each day, used in High Stocks

                 for (var i = 0; i < quotes.length; i++) {
                  //loop through quotes JSON Object for each Stock  

                    var date = Date.parse(quotes[i].date);

                    var object = [date, quotes[i].close];

                    dataSeries.push(object);

                } //for loop

                var sendData = {

                  name: req.params.query,

                  data: dataSeries,

                  tooltip: {

                    valueDecimals: 2

                  }

                };
                
                var sendDB = {
                //create object with symbol to insert into DB  
                  
                  "symbol": req.params.query
                  
                };
                
                
                db.collection(STOCKS_COLLECTION).insertOne(sendDB, function(err,doc){
                //add symbol to database here
                
                
                                  
                  if(err){
                    
                    handleError(res, err.message, "Failed to insert stock");
                    
                  } else {
                    
                      sendDB = {};
                    
                  }
                  
                  
                });

                io.emit('add', sendData);
                //emit the array with the historical stock data back to all clients in Angular JS
              
              } //if else

            }//function(err, quotes) 
    
    }); // yahooFinance.historical
    
  }); //app.get("/addquotes/:query"
  
  
  app.get("/removequotes/:query", function(req,res){
  //route to remove a stock from database
  
  console.log(req.params.query);
    
    db.collection(STOCKS_COLLECTION).deleteOne({"symbol": req.params.query}, function(err,doc){
      
      if(err){
        
        handleError(res,err.message, "Failed to remove stock from DB");
        
      } else {
        
        console.log("Stock successfully deleted");
        
        io.emit('remove', req.params.query);
        
      }
      
      
    });
    
    
    
  })


}); //mongodb.MongoClient.connect
