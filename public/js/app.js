/*global angular*/
/*global Highcharts*/

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

  })
  .controller("mainController", function($scope, Stocks) {

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
            text: 'Chart My Stocks'
          },
          useHighStocks: true
        };

      }, function(response) {

        console.log("Could not retrieve stocks data");

      });

    /*$scope.chartConfig.series.push({
         name: 'Apple',
         data: [
             [1147651200000, 23.15],
             [1147737600000, 23.01],
             [1147824000000, 22.73],
             [1147910400000, 22.83],
             [1147996800000, 22.56],
             [1148256000000, 22.88],
             [1148342400000, 22.79],
             [1148428800000, 23.50],
             [1148515200000, 23.74],
             [1148601600000, 23.72],
             [1148947200000, 23.15],
             [1149033600000, 22.65]
         ]
     }, {
         name: 'Google',
         data: [
             [1147651200000, 25.15],
             [1147737600000, 25.01],
             [1147824000000, 25.73],
             [1147910400000, 25.83],
             [1147996800000, 25.56],
             [1148256000000, 25.88],
             [1148342400000, 25.79],
             [1148428800000, 25.50],
             [1148515200000, 26.74],
             [1148601600000, 26.72],
             [1148947200000, 26.15],
             [1149033600000, 26.65]
         ]

     }

     );*/
     

    $scope.addSymbol = function(query) {
      //function when user clicks search button for a stock symbol
      //gets stock quotes with symbols directly from Yahoo Finance API and updates $scope

      console.log(query);
      
      //check with Yahoo API if the symbol exists
      
      Stocks.addQuote(query)
        .then(function(response){
          
          if(response.data.length === 0){
          //if the Web API returns an empty array, the stock symbol does not exist  
            
            $scope.notexist = "Stock symbol does not exist, please try again!";
            //custom error message shown in front-end
          
            
          } else {
            
            $scope.notexist = "";
            //reset custom error message in front-end
            
            $scope.chartConfig.series.push(response.data);
            //add the fetched historical data array for symbol to the chartConfig series array
            
            $scope.symbols.push(response.data.name);
            //add the symbol to be listed in front-end
            
          } 
          
          
        }, function(response){
          
          console.log("Error finding the stock")
          
        });
      
    };
    
    $scope.removeSymbol = function(symbol){
    //method to remove stock from database and scope when user clicks "x" 
      
      console.log(symbol);
      
      
    };


  });

