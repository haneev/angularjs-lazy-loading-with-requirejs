/**
 * Angular module loader
 * Using requirejs
 * 
 * @author Han van der Veen
 */
define(["angular" ], function() {
	
	/** Default settings of this loader */
	var settings = {
		mainModule : 'app'
	};
	
	/** @var {array} list of modules which are already loaded */
	var loadedModules = [];
	
	/**
	 * This register and init function is partly copied from https://github.com/ocombe/ocLazyLoad
	 * Improved for config callback and returning the modules  
	 */
	function init() {
		loadedModules = getDependencies(settings.mainModule);
	}

	/**
	 * Get dependencies of the module
	 * @return {array} list of modules it depends on
	 */
	function getDependencies(mod) {
		var requiredModules = ['ng'];
		
		// recursive load the modules
		(function addReg(module) {
			requiredModules.push(module);
		    angular.forEach(angular.module(module).requires, function (m) {
		    	addReg(m);
		    });
		})(mod);
		
		return requiredModules;
	}
	
	/**
	 * Register the module to the providers
	 * @param {object} providers Providers object
	 * @param {array} registerModules modules to load
	 * @param {function} configCallback The config callback that is used before init this module
	 * @return {array} list of module objects
	 */
	function register(providers, registerModules, configCallback) {  
	    var i, ii, k, invokeQueue, moduleName, moduleFn, invokeArgs, provider;	    
	    var returnModules = [];
	    
	    if(registerModules && registerModules.length > 0) {
	        var runBlocks = [];
	        for(k = registerModules.length - 1; k >= 0; k--) {
	        	
	            moduleName = registerModules[k];
	            moduleFn = angular.module(moduleName);
	            returnModules.push(moduleFn);
	            
	            // Check if the module is already loaded
	            if(loadedModules.indexOf(moduleName) >= 0) {
	            	continue;
	            }
	            
	            // Load dependencies
	            angular.forEach(getDependencies(moduleName), function (module) {
	            	if(loadedModules.indexOf(module) == -1 && moduleName != module) {
	            		register(providers, [module]);
	            	}
	            });
	            
	            // register config callback
	            if(configCallback) {
	            	moduleFn.config(configCallback);
	            }
	            
	            runBlocks = runBlocks.concat(moduleFn._runBlocks);
	            try {
	                for(invokeQueue = moduleFn._invokeQueue, i = 0, ii = invokeQueue.length; i < ii; i++) {
	                    invokeArgs = invokeQueue[i];
	                    
	                    if(providers.hasOwnProperty(invokeArgs[0])) {
	                        provider = providers[invokeArgs[0]];
	                    } else {
	                        throw "unsupported provider " + invokeArgs[0];
	                    }
	                    
	                    provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
	                }
	            } catch(e) {
	                if(e.message) 
	                    e.message += ' from ' + moduleName;
	                throw e;
	            }
	            registerModules.pop();
	            
	            // loaded correctly!
	            loadedModules.push(moduleName);
	        }
	        
	        // run the module (config and run part)
	        angular.forEach(runBlocks, function(fn) {
	        	var $injector = angular.injector(['ng']); // this injector is only for running it
	        	$injector.invoke(fn);
	        });
	        
	    }
	    return returnModules;
	};
	
	// run the loader
	init();
	
    return {
    	/**
    	 * Set the settings 
    	 * @param {object} settings that can be set
    	 * @returns settings object 
    	 */
    	init : function (set) {
    		return angular.extend(settings, set); 
    	},
    	/**
    	 * Load a external module into the current one
    	 * @param {string} module name (files already loaded)
    	 * @param {array} configCallback optional callback when a config is needed for the module
    	 * @returns {array|module}
    	 */
    	module : function (module, configCallback) {
    		var sourceModule = angular.module(settings.mainModule);
    		
    		var modules = module;
    		if(angular.isString(module)) {
    			modules = [module];
    		}
    		
    		// load them
    		var returnModules = register(sourceModule._providerObject, modules, configCallback);
    		
    		return (modules.length == 1) ? returnModules[0] : returnModules;
    	}
    };
});