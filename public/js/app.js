/*global angular*/
/*global Highcharts*/
/*global io*/


var socket = io();  

angular.module("stocksApp", ['ngRoute', 'highcharts-ng'])
  //create Angular JS app and inject ngRoute module
  .config(function($routeProvider) {

    $routeProvider
      .when("/", {

        templateUrl: "stocks.html",
        controller: "mainController",

      });
  })
  .service("Stocks", function($http) {
    //service that interacts with Node/Express RESTful API's
    //injects native $http module for communication with server
    

    var url = "quotes/";


    this.retrieveQuotes = function() {

      return $http.get(url);

    };
    
    this.addQuote = function(query){
      
      var addUrl = "addquotes/" + query;
      
      return $http.get(addUrl);
      
    };
    
    this.removeQuote = function(query){
    //Service to call RESTful API to remvoe a stock  
      
      var removeUrl = "removequotes/" + query;
      
      return $http.get(removeUrl);
      
    };

  })
  .controller("mainController", function($scope,Stocks){
  
    Stocks.retrieveQuotes()
      .then(function(response) {
        //when page loads and mainController, automatically call REST API to retrieve an object with stocks data  

        $scope.stocks = response.data;
        
        //create an array of symbols here to display in the front-end
        
        $scope.symbols = $scope.stocks.map(function(value, index){
          
            return value.name;
          
        });

        $scope.chartConfig = {
          options: {
            chart: {
              zoomType: 'x'
            },
            rangeSelector: {
              enabled: true,
              selected: 4
            },
            navigator: {
              enabled: true,
              series: $scope.stocks
            }
          },
          series: $scope.stocks,
          title: {
            text: 'WeChart'
          },
          subtitle: {
            text: 'Stock charts with real-time sync across clients| build with MEAN + Socket.io'
          },
  
          useHighStocks: true,
          
          
        };

      }, function(response) {

        console.log("Could not retrieve stocks data");

      });
      
      socket.on('add', function(response){
      //listen on add event socket.io, send from server when stock quote is added  
         
         if(response.length === 0){
          //if the Web API returns an empty array, the stock symbol does not exist  
           
            $scope.$apply(function(){
              
              $scope.notexist = "Stock symbol does not exist, please try again!";
              //custom error message shown in front-end
              
              });
            
          
          } else {
            
            
            $scope.$apply(function(){
            
              $scope.notexist = "";
              //reset custom error message in front-end
            
              $scope.chartConfig.series.push(response);
              //add the fetched historical data array for symbol to the chartConfig series array
            
              $scope.symbols.push(response.name);
              //add the symbol to be listed in front-end  
              
              
            });
            
            
          } 
          
  
    });  


    $scope.addSymbol = function(query) {
      //function when user clicks search button for a stock symbol
      //gets stock quotes with symbols directly from Yahoo Finance API and updates $scope

      console.log(query);
      
      //check with Yahoo API if the symbol exists
      
      Stocks.addQuote(query);
      //call service that calls Web API on server to add a quote to chart and list scope
      
    };
    
      socket.on('remove', function(response){
      //listen on remove event from server socket.io and remove stock from scope
        
        $scope.$apply(function(){
    
          var index = $scope.symbols.indexOf(response);
          //find index that matches the query in symbols that is being displayed in list group and remove
      
          $scope.symbols.splice(index,1);
      
          var indexStock = 0;
      
          for(var i = 0; i < $scope.chartConfig.series.length; i++){
          //find index that matches the query in chartConfig series and remove  
      
              if($scope.chartConfig.series[i].name == response){
            
              indexStock = i;
            
            }
        
          }
      
          $scope.chartConfig.series.splice(indexStock, 1);
      
        }); //$scope.$apply;
      
      }); //socket.on('remove');
    
    $scope.removeSymbol = function(symbol){
    //method to remove stock from database and scope when user clicks "x" 
      
      /*remove stock from chart series database*/
      
      Stocks.removeQuote(symbol)
        .then(function(response){
          
          console.log("Stock removed from database");
          
        }, function(response){
          
          console.log("Could not remove stock from database");
          
          
        });
  
    };

  });

