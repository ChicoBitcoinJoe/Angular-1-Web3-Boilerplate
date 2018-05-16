var app = angular.module('app',['ngRoute','ngMaterial','ngAria','ngAnimate']);

app.run(['$rootScope', function($rootScope) {
    console.log('App is loading.');
}]);

app.controller('AppController', ['$scope','$q','$web3','$location','Profile','PriceFeed',
function($scope, $q, $web3, $location, Profile, PriceFeed) {
    console.log('Loading AppController');

    var ready = $q.defer();

    $scope.web3 = $web3;

    $scope.app = {
        ready: ready.promise,
        path: parsePath(),
        web3: {
            network: $web3.networks.kovan,
            connected: null,
            currentBlock: null,
            account: {
                isLoggedIn: null,
                address: null,
                balance: null
            }
        },
        
        price: {
            usd: {
                eth: null
            },
            eth: {
                usd: null
            }
        },
        error: null
    };

    $web3.getNetworkId().then(function(currentNetworkId){
        $scope.app.web3.connected = true;

        if($scope.app.web3.network != currentNetworkId){
            var err = 'Connected to the wrong network!';
            $scope.app.error = err;
            ready.reject(err);
            console.error(err);
            console.log($scope.app);
            return ready.promise;
        } else {
            return $q.all([
                $web3.getBlock('latest'),
                $web3.getCurrentAccount(),
                PriceFeed.get('usd','eth'),
                PriceFeed.get('eth','usd'),
            ]);
        }
    }).then(function(promises){
        var currentBlock = promises[0];
        var currentAccount = promises[1];
        var usdPerEth = promises[2];
        var ethPerUsd = promises[3];

        $scope.app.web3.currentBlock = currentBlock;
        $scope.app.price['usd']['eth'] = usdPerEth;
        $scope.app.price['eth']['usd'] = ethPerUsd;

        return Profile.get(currentAccount);
    }).then(function(profile){
        $scope.app.web3.account = profile;
        console.log($scope.app);
        ready.resolve();
    }).catch(function(err){
        $scope.app.web3.connected = false;
        $scope.app.error = err;
        ready.reject(err);
        console.error(err);
        console.log($scope.app);
    });
        
    
    function parsePath(){
        var path = $location.path();
        return path.split('/').slice(1,path.length);
    }

    $scope.$on('$routeChangeStart', function($event, next, current) {
        $scope.app.path = parsePath();
    });

    web3.eth.filter('latest', function(err, blockHash){
        //console.log(err, blockHash);
        console.log('New block found. Updating current block...');
        $web3.getBlock(blockHash).then(function(currentBlock){
            $scope.app.web3.currentBlock = currentBlock;
        });
    });

}]);