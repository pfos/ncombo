var EventDispatcher = function() {
	var self = this;
	self._listeners = {};
	
	self.on = function(event, listener) {
		if(!self._listeners.hasOwnProperty(event)) {
			self._listeners[event] = {};
		}
		self._listeners[event][listener] = listener;
	}
	
	self.hasListener = function(event, listener) {
		return self._listeners.hasOwnProperty(event) && self._listeners[event].hasOwnProperty(listener);
	}
	
	self.removeListener = function(event, listener) {
		if(self.willTrigger(event, listener)) {
			delete self._listeners[event][listener];
		}
	}
	
	self.emit = function(event, eventData) {
		if(self._listeners.hasOwnProperty(event)) {
			var eventListeners = self._listeners[event];
			var i;
			for(i in eventListeners) {
				eventListeners[i](eventData);
			}
		}
	}
	
	self.numListeners = function(event) {
		if(self._listeners[event]) {
			var count = 0;
			var i;
			for(i in self._listeners[event]) {
				count++;
			}
			return count;
		}
		return 0;
	}
}

var $loader = {
	_ie: false,
	_ieVersion: null,
	_embedCounter: null,
	
	_loaderStart: null,
	_frameworkURL: null,
	_routToScriptURL: null,
	_cacheVersion: NCOMBO_CACHE_VERSION,
	
	_appDefinition: null,
	_resources: null,
	_resourceIDs: null,
	_resourcesLoaded: null,
	
	_deepResources: null,
	_deepResourcesLoaded: null,
	
	_resourcesLoadedMap: null,
	
	_waitForReadyInterval: null,
	_attempts: null,
	
	_skipPreload: null,
	_timeout: 10000,

	ready: function(callback) {
		$loader.on('ready', callback);
		
		if(!$loader._waitForReadyInterval) {
			$loader._waitForReadyInterval = setInterval($loader._waitForReady, 20);
		}
	},
	
	init: function(frameworkURL, routToScriptURL, loadScriptURL, resources, appDefinition, skipPreload) {
		$loader._frameworkURL = frameworkURL;
		$loader._routToScriptURL = routToScriptURL;
		
		$loader._appDefinition = appDefinition;
		
		$loader._resources = resources;
		$loader._resources.push($loader._routToScriptURL);
		
		if(/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
			$loader._ie = true;
			$loader._ieVersion = new Number(RegExp.$1);
		}
		
		$loader.grab.init(appDefinition);
		$loader._skipPreload = skipPreload;
		if(skipPreload) {
			$loader._waitForReadyInterval = setInterval($loader._waitForReady, 20);
		} else {
			$loader.grab.scriptTag(loadScriptURL, 'text/javascript');
		}
	},
	
	getAppDefinition: function() {
		return $loader._appDefinition;
	},
	
	_embedAllResources: function() {
		$loader.grab._processEmbedQueue();
	},
	
	_waitForReady: function() {
		var head = document.getElementsByTagName('head')[0];
		
		if(head && document.body) {
			clearInterval($loader._waitForReadyInterval);
			if($loader._skipPreload) {
				$loader.loadAll(function() {
					$loader._embedAllResources();
				});
			} else {
				$loader._startLoading();
			}
		}
	},
	
	_startLoading: function() {
		var settings = {};
		var i;
		for(i in $loader._appDefinition) {
			settings[i] = $loader._appDefinition[i];
		}
		settings.resources = $loader._resources;
		$loader.emit('ready', settings);
	},
	
	_globalEval: function(src) {
		if(window.execScript) {
			window.execScript(src);
		} else {
			window.eval.call(window, src);
		}
	},
	
	_resourceEmbedQueue: [],
	
	loadAll: function(callback) {
		var i;
		var numLoaded = 0;
		var triggeredLoadAllFail = false;
		for(i in $loader._resources) {
			$loader.grab._loadResourceToEmbedQueue($loader._resources[i], function(err) {
				if(err) {
					if(!triggeredLoadAllFail) {
						triggeredLoadAllFail = true;
						$loader.grab._loadAllFail();
					}
				} else {
					if(++numLoaded >= $loader._resources.length) {
						if(callback) {
							callback();
						}
						$loader.emit('loadall');
					}
				}
			});
		}
	},
	
	_loadAllFail: function() {
		$loader.emit('loadallfail');
	},
	
	finish: function() {
		$loader._embedAllResources();
	},
	
	ajax: function(settings) {
		var type;
		if(settings.type) {
			type = settings.type;
		} else {
			type = "GET";
		}
	
		var xmlhttp = $loader._getHTTPReqObject();
		xmlhttp.open(type, settings.url, true);
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4) {
				if(xmlhttp.status == 200) {
					if(settings.success) {
						settings.success(xmlhttp.responseText);
					}
				} else {
					if(settings.error) {
						settings.error(xmlhttp.statusText);
					} else {
						throw "Failed to load resource: " + url;
					}
				}
			}
		}
		xmlhttp.send(null);
	},
	
	_getHTTPReqObject: function() {
		var xmlhttp = null;
		
		if($loader._ie && $loader._ieVersion < 7) {
			try {
				xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (exceptionA) {
				try {
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (exceptionB) {
					xmlhttp = null;
				}
			}
		}
		
		if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
			try {
				xmlhttp = new XMLHttpRequest();
			} catch (e) {
				xmlhttp = null;
			}
		}
		
		if(!xmlhttp) {
			throw "Could not instantiate XMLHttpRequest";
		}
		
		return xmlhttp;
	},
	
	grab: {
		_options: {},
		_callbacks: {
			ready: [],
			fail: []
		},
		_activeScripts: new Object(),
		_activeCSS: new Object(),
		_resources: [],
		_resourcesLoaded: [],
		_resourcesGrabbed: [],
		_deepResources: [],
		_deepResourcesLoaded: [],
		_resourcesLoadedMap: {},
		_deepResources: {},
		_deepResourcesLoaded: {},
		_scriptCodes: {},
		_embedQueue: [],
		_extRegex: /[.][^\/\\]*$/,
		_lessExtRegex: /[.]less$/,
		
		init: function(options) {
			$loader.grab._options = options;
		},
		
		_globalEval: function(src) {
			if(window.execScript) {
				window.execScript(src);
			} else {
				(function() {
					window.eval.call(window, src);
				})();
			}
		},
		
		_triggerReady: function() {
			var callbacks = $loader.grab._callbacks['ready'];
			$loader.grab._callbacks['ready'] = [];
			if(callbacks.length > 0) {
				$loader.grab._execReadyCallbacks(callbacks);
			}
		},
	
		_execReadyCallbacks: function(callbacks) {
			var len = callbacks.length;
			var i;
		
			for(i=len-1; i>=0; i--) {
				callbacks[i]();
			}
		},
	
		_triggerFail: function(url) {
			var len = $loader.grab._callbacks['fail'].length;
			var i;
			for(i=0; i<len; i++) {
				 $loader.grab._callbacks['fail'][i](url);
			}
		},
		
		/**
			Bind a callback function to nCombo's ready event. The specified function will be called when nCombo is ready to begin processing.
		*/
		ready: function(callback) {
			if(!$loader.grab.isGrabbing()) {
				callback();
			} else {
				$loader.grab._callbacks['ready'].push(callback);
			}
		},

		/**
			Bind a callback function to nCombo's fail event. The specified function will be called when nCombo fails to load a resource.
			The callback can accept a parameter which indicates the URL of the resource which failed to load.
		*/
		fail: function(callback) {
			$loader.grab._callbacks['fail'].push(callback);
		},
		
		app: {
			script: function(name, callback) {				
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.appScriptsURL + name;
				} else {
					var resourceName = $loader.grab._options.appScriptsURL + name + '.js';
				}
				$loader.grab.script(resourceName, callback);
			},
			
			style: function() {
				var name = arguments[0];
				var callback = null;
				var fresh = false;
				if(arguments[1] instanceof Function) {
					callback = arguments[1];
				} else {
					fresh = arguments[1];
					if(arguments[2]) {
						callback = arguments[2];
					}
				}
				
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.appStylesURL + name;
				} else {
					var resourceName = $loader.grab._options.appStylesURL + name + '.css';
				}
				$loader.grab.style(resourceName, fresh, callback);
			},
			
			assetURL: function(nameWithExtension) {
				return $loader.grab._options.appAssetsURL + nameWithExtension;
			},
			
			fileURL: function(nameWithExtension) {
				return $loader.grab._options.appFilesURL + nameWithExtension;
			}
		},
		
		framework: {
			lib: function(name, callback) {				
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.jsLibsURL + name;
				} else {
					var resourceName = $loader.grab._options.jsLibsURL + name + '.js';
				}
				$loader.grab.script(resourceName, callback);
			},
			
			style: function() {
				var name = arguments[0];
				var callback = null;
				var fresh = false;
				if(arguments[1] instanceof Function) {
					callback = arguments[1];
				} else {
					fresh = arguments[1];
					if(arguments[2]) {
						callback = arguments[2];
					}
				}
				
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.frameworkStylesURL + name;
				} else {
					var resourceName = $loader.grab._options.frameworkStylesURL + name + '.css';
				}
				$loader.grab.style(resourceName, fresh, callback);
			},
			
			plugin: function(name, callback) {
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.pluginsURL + name;
				} else {
					var resourceName = $loader.grab._options.pluginsURL + name + '.js';
				}
				$loader.grab.script(resourceName, callback);
			},
			
			script: function(name, callback) {
				if($loader.grab._extRegex.test(name)) {
					var resourceName = $loader.grab._options.frameworkScriptsURL + name;
				} else {
					var resourceName = $loader.grab._options.frameworkScriptsURL + name + '.js';
				}
				$loader.grab.script(resourceName, callback);
			}
		},
		
		script: function(resourceName, callback) {			
			if(!$loader.grab._activeScripts[resourceName]) {
				$loader.grab.loadAndEmbedScript(resourceName, callback);
				$loader.grab._activeScripts[resourceName] = true;
			}
		},
		
		style: function() {
			var resourceName = arguments[0];
			var callback = null;
			var fresh = false;
			if(arguments[1] instanceof Function) {
				callback = arguments[1];
			} else {
				fresh = arguments[1];
				if(arguments[2]) {
					callback = arguments[2];
				}
			}
			
			if(!$loader.grab._activeCSS[resourceName] || fresh) {
				$loader.grab.loadAndEmbedCSS(resourceName, fresh, callback);
				$loader.grab._activeCSS[resourceName] = true;
			}
		},
		
		/**
			Get the the image at the given URL and start downloading it.
		*/
		image: function() {
			var url = arguments[0];
			var callback = null;
			var fresh = false;
			if(arguments[1] instanceof Function) {
				callback = arguments[1];
			} else {
				fresh = arguments[1];
				if(arguments[2]) {
					callback = arguments[2];
				}
			}
			
			var img = new Image();
			
			if(callback) {
				var timedOut = false;
				var timeout = setTimeout(function() {
					timedOut = true;
					callback('Failed to load resource at URL: ' + url);
				}, $loader._timeout);
				
				img.onload = function() {
					if(!timedOut) {
						clearTimeout(timeout);
						callback(null, url);
					}
				}
			}
			
			if(fresh) {
				img.src = smartCacheManager.setCacheKiller(url);
			} else {
				if($loader.grab._options.releaseMode) {
					img.src = smartCacheManager.setURLCacheVersion(url);
				} else {
					img.src = url;
				}
			}
			return img;
		},
		
		_processEmbedQueue: function() {
			var curTag;
			if($loader.grab._embedQueue.length > 0) {
				curTag = $loader.grab._embedQueue[0];
				if(curTag.ready) {
					$loader.grab._embedQueue.shift();
					if(curTag.type == 'link') {
						$loader.grab.linkTag(curTag.url, 'text/css', 'stylesheet', curTag.query);
						$loader.grab._resourcesGrabbed.push(curTag.url);
						if(curTag.callback) {
							curTag.callback(curTag.error, curTag.url);
						}
						if(!$loader.grab.isGrabbing()) {
							$loader.grab._triggerReady();
						}
						$loader.grab._processEmbedQueue();
					} else if(curTag.type == 'script') {
						if($loader.grab._options.releaseMode) {
							$loader.grab._globalEval($loader.grab._scriptCodes[curTag.url]);
							$loader.grab._resourcesGrabbed.push(curTag.url);
							if(curTag.callback) {
								curTag.callback(curTag.error, curTag.url);
							}
							if(!$loader.grab.isGrabbing()) {
								$loader.grab._triggerReady();
							}
							$loader.grab._processEmbedQueue();
						} else {
							if(curTag.error) {
								$loader.grab._resourcesGrabbed.push(curTag.url);
								if(curTag.callback) {
									curTag.callback(curTag.error, curTag.url);
								}
								if(!$loader.grab.isGrabbing()) {
									$loader.grab._triggerReady();
								}
								$loader.grab._processEmbedQueue();
							} else {
								$loader.grab.scriptTag(curTag.url, 'text/javascript', null, function(err) {
									$loader.grab._resourcesGrabbed.push(curTag.url);
									
									if(curTag.callback) {
										curTag.callback(err, curTag.url);
									}
									if(!$loader.grab.isGrabbing()) {
										$loader.grab._triggerReady();
									}
									$loader.grab._processEmbedQueue();
								}, curTag.query);
							}
						}
					}
				}
			}
		},
		
		_loadResourceToEmbedQueue: function(url, callback) {
			var ext = url.match(/[.][^.]*$/);
			var tagData;			
			
			if(ext[0] == '.js') {
				tagData = {type: 'script', url: url, callback: function(){}, ready: false};
				
			} else if(ext[0] == '.css' || ext[0] == '.less') {
				tagData = {type: 'link', url: url, callback: function(){}, ready: false}
			} else {
				return false;
			}
			
			$loader.grab._embedQueue.push(tagData);
			
			$loader.grab._loadDeepResourceToCache(url, false, function(err, data) {
				tagData.ready = true;
				tagData.error = err;
				callback(err, data);
			});
			
			return true;
		},
		
		loadAndEmbedScript: function(url, callback) {			
			var tagData = {type: 'script', url: url, callback: callback, error: null, ready: false};
			$loader.grab._embedQueue.push(tagData);
			$loader.grab._loadDeepResourceToCache(url, false, function(err) {
				tagData.ready = true;
				tagData.error = err;
				$loader.grab._processEmbedQueue();
			});
		},
		
		loadAndEmbedCSS: function() {
			var url = arguments[0];
			var callback = null;
			var fresh = false;
			if(arguments[1] instanceof Function) {
				callback = arguments[1];
			} else {
				fresh = arguments[1];
				if(arguments[2]) {
					callback = arguments[2];
				}
			}
			
			var ck = null;
			if(fresh) {
				ck = smartCacheManager.getCacheKillerParam();
			}
			
			var tagData = {type: 'link', url: url, callback: callback, error: null, ready: false, query: ck}
			$loader.grab._embedQueue.push(tagData);
			$loader.grab._loadDeepResourceToCache(url, ck, function(err) {
				tagData.ready = true;
				tagData.error = err;
				$loader.grab._processEmbedQueue();
			});
		},
		
		/**
			Insert a script tag into the current document as it is being constructed.
			The id & callback parameters are optional.
		*/
		scriptTag: function(url, type, id, callback, query) {		
			var head = document.getElementsByTagName('head')[0];
			
			var script = document.createElement('script');
			
			var timedOut = false;
			var timeout = null;
			if(callback) {
				timeout = setTimeout(function() {
					timedOut = true;
					callback('Failed to embed script tag at URL: ' + url);
				}, $loader._timeout);
			}
			
			if(!$loader._ie || parseInt($loader._ieVersion) > 8) {
				if(callback) {
					script.onload = function() {
						if(!timedOut) {
							if(timeout) {
								clearTimeout(timeout);
							}
							callback(null, url);
						}
					};
				}
			} else {
				if(callback) {
					script.onreadystatechange = function() {
						if(this.readyState == 'complete' || this.readyState == 'loaded') {
							if(!timedOut) {
								if(timeout) {
									clearTimeout(timeout);
								}
								script.onreadystatechange = null;
								callback(null, url);
							}
						}
					};
				}
			}
			
			if(id) {
				script.id = id;
			}
			script.type = type;
			
			if(query) {
				script.src = url + '?' + query;
			} else {
				if($loader.grab._options.releaseMode) {
					script.src = smartCacheManager.setURLCacheVersion(url);
				} else {
					script.src = url;
				}
			}
			
			head.appendChild(script);
		},
		
		/**
			Insert a link tag into the current document as it is being constructed.
			The id & callback parameters are optional.
		*/
		linkTag: function(url, type, rel, query, id) {
			var head = document.getElementsByTagName('head')[0];
			
			var curScripts = document.getElementsByTagName('script');
			var firstScript = null;
			var firstIndex = 0;
			
			if(curScripts) {
				var len = curScripts.length;
				while(firstIndex < len && curScripts[firstIndex].parentNode != head) {
					firstIndex++;
				}
				if(firstIndex < len) {
					firstScript = curScripts[firstIndex];
				}
			}
			
			var link = document.createElement('link');
			
			if(id) {
				link.id = id;
			}
			link.rel = rel;
			link.type = type;
			if(query) {
				link.href = url + '?' + query;
			} else {
				if($loader.grab._options.releaseMode) {
					link.href = smartCacheManager.setURLCacheVersion(url);
				} else {
					link.href = url;
				}
			}
			
			if(firstScript) {
				head.insertBefore(link, firstScript);
			} else {
				var curLinks = document.getElementsByTagName('link');
				var lastLink = null;
				var lastIndex = curLinks.length - 1;
				if(curLinks) {
					while(lastIndex >= 0 && curLinks[lastIndex].parentNode != head) {
						lastIndex--;
					}
					if(lastIndex >= 0) {
						lastLink = curLinks[lastIndex];
					}
				}
				
				if(lastLink) {
					if(lastLink.nextSibling) {
						head.insertBefore(link, lastLink.nextSibling);
					} else {
						head.appendChild(link);
					}
				} else {
					head.appendChild(link);
				}
			}
		},
		
		isGrabbing: function() {
			return $loader.grab._resourcesGrabbed.length < $loader.grab._resources.length;
		},
		
		_loadDeepResourceToCache: function(url, fresh, callback, rootURL) {
			url = url.replace(/[?].*/, '');
			if(!$loader.grab._resourcesLoadedMap[url]) {
				var resourceData = null;
				
				if(!rootURL || url == rootURL) {
					rootURL = url;
					$loader.grab._resources.push(url);
					$loader.grab._deepResources[rootURL] = [];
					$loader.grab._deepResources[rootURL].push(url);
					
					$loader.grab._deepResourcesLoaded[rootURL] = [];
				}
				
				if(/[.](png|jpg|gif)$/.test(url)) {
					// images
					var img = new Image();
					img.onload = function() {
						if(url == rootURL) {
							resourceData = img;
						}	
						$loader.grab._resourcesLoadedMap[url] = true;
						$loader.grab._deepResourcesLoaded[rootURL].push(url);
						
						if($loader.grab._deepResourcesLoaded[rootURL].length >= $loader.grab._deepResources[rootURL].length) {
							$loader.grab._resourcesLoaded.push(rootURL);
							if(callback) {
								callback(null, {url: rootURL, data: resourceData});
							}
						}
					};
					
					img.onerror = function() {
						$loader.grab._triggerFail(url);
						if(callback) {
							callback('Failed to load resource at url: ' + url);
						}
					};
					
					var tempURL;
					
					if($loader.grab._options.releaseMode) {
						if(fresh) {
							tempURL = smartCacheManager.setCacheKillerParam(url, fresh);
						} else {
							tempURL = smartCacheManager.setURLCacheVersion(url);
						}
					} else {
						tempURL = url;
					}
					
					img.src = tempURL;
				} else {
					var tempURL;
					if($loader.grab._options.releaseMode) {
						if(fresh) {
							tempURL = smartCacheManager.setCacheKillerParam(url, fresh);
						} else {
							tempURL = smartCacheManager.setURLCacheVersion(url);
						}
					} else {
						tempURL = url;
					}
					
					// all text-based files
					$loader.ajax({
						url: tempURL,
						type: "GET",
						dataType: "html",
						cache: true,
						async: true,
						success: function(data) {
							if(url == rootURL) {
								resourceData = data;
							}
							
							$loader.grab._resourcesLoadedMap[url] = true;
							$loader.grab._deepResourcesLoaded[rootURL].push(url);
							var urls, nonLoadedURLs;
							if(/[.](css|less)$/.test(url)) {
								nonLoadedURLs = [];
								urls = $loader.grab._parseDeepCSSURLs(data, url);
								
								var i, curURL;
								var len = urls.length;
								for(i=0; i<len; i++) {
									curURL = urls[i];
									
									if(!$loader.grab._resourcesLoadedMap[curURL]) {
										$loader.grab._deepResources[rootURL].push(curURL);
										nonLoadedURLs.push(curURL);
									}
								}
								
								len = nonLoadedURLs.length;
								
								for(i=0; i<len; i++) {
									$loader.grab._loadDeepResourceToCache(nonLoadedURLs[i], fresh, callback, rootURL);
								}
							} else if(/[.]js$/.test(url)) {	
								$loader.grab._scriptCodes[url] = data;
							}
							
							if($loader.grab._deepResourcesLoaded[rootURL].length >= $loader.grab._deepResources[rootURL].length) {
								$loader.grab._resourcesLoaded.push(rootURL);
								if(callback) {
									callback(null, {url: rootURL, data: resourceData});
								}
							}
						},
						
						error: function() {
							$loader.grab._triggerFail(url);
							if(callback) {
								callback('Failed to load resource at url: ' + url);
							}
						}
					});
				}
			}
		},
		
		_parseDeepCSSURLs: function(fileContent, fileURL) {
			var urlMap = {};
			var urls = [];
			var fileDirURL = fileURL.match(/^(.*)\//)[0];
			
			var chuncks = $loader.grab._parseFunctionCalls(fileContent, ['url']);
			
			var imports = fileContent.match(/@import +["'][^"']+["']/g);
			if(imports) {
				chuncks = chuncks.concat(imports);
			}
			
			var isolateURL = /(^url[(][ ]*["']?|["']?[)]$|^@import[ ]*["']|["']$)/g;
			var absolute = /^https?:[/][/]/;
			
			var i, curURL;
			var len = chuncks.length;
			for(i=0; i<len; i++) {
				curURL = chuncks[i].replace(isolateURL, '');
				if(curURL != "" && !urlMap.hasOwnProperty(curURL)) {
					if(!absolute.test(curURL)) {
						urls.push(fileDirURL + curURL);
					} else {
						urls.push(curURL);
					}
					urlMap[curURL] = true;
				}
			}
				
			return urls;
		},
		
		_parseFunctionCalls: function(string, functionNames) {
			var functionCalls = [];
			var functionsRegex = new RegExp('(([^A-Za-z0-9]|^)' + functionNames.join(' *[(]|([^A-Za-z0-9]|^)') + ' *[(])', 'gm');
			var startPos = 0;
			var i, ch, len, curFunc, bt;
			while(true) {
				startPos = string.search(functionsRegex);
				if(startPos < 0) {
					break;
				}
				
				if(string.charAt(startPos) == '(') {
					startPos++;
				}
				
				curFunc = '';
				len = string.length;
				bt = 0;
				for(i=startPos; i<len; i++) {
					ch = string.charAt(i);
					curFunc += ch;
					
					if(ch == '(') {
						bt++;
					} else if(ch == ')') {
						if(--bt == 0) {
							functionCalls.push(curFunc.replace(/^[^A-Za-z0-9]/, ''));
							break;
						}
					}
				}
				string = string.substr(startPos + 2);
			}
			return functionCalls;
		}
	}
}

EventDispatcher.apply($loader);
