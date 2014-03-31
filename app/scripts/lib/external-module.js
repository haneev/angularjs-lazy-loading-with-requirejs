define(['angular'], function () {

	angular.module('external', []).directive('myExternal', function () {
		return {
			template : 'An external module directive'
		};
	});

});