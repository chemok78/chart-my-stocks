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


  })
  .controller("mainController", function($scope, Stocks) {

    //function for on load the stocks
    //looks in database which stocks are searched
    //calls Yahoo Finance API and sets scope

    //check in MyVotely how charts are implemented

    //always get the data back in an array of objects
    
  Stocks.retrieveQuotes()
    .then(function(response){
    //when page loads and mainController, automatically call REST API to retrieve an object with stocks data  
      
        $scope.stocks = response.data;
        
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
                enabled: true
            }
        },
        series: $scope.stocks,
        title: {
            text: 'Chart My Stocks'
        },
        useHighStocks: true
    };
      
    }, function(response){
      
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


   
    $scope.getQuotes = function() {
      //function when user clicks search button
      //gets stock quotes with symbols directly from Yahoo Finance API and updates $scope

      Stocks.retrieveQuotes()
        .then(function(response) {
          
          //edit data object and use it as series property in Highcharts

          $scope.stocks = response.data;

        }, function(response) {

          alert("Error retrieving stock quotes");

          console.log(response);

        });


    };


  });
