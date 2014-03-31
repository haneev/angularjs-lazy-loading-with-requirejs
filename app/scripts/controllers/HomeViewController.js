define(['app', 'services/module-loader', 'lib/external-module'], function(app, load)
{
	load.module('external');
	
	app.controller('HomeViewController',
    [
        '$scope',

        function($scope)
        {
            $scope.page =
            {
                heading: 'Welcome'
            };
        }
    ]);
});