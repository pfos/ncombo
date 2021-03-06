var LoadBalancer = require('loadbalancer');
var fs = require('fs');
var url = require('url');
var browserify = require('browserify');
var scriptManager = require('ncombo/scriptmanager');
var cssBundler = require('ncombo/css-bundler');
var templateBundler = require('ncombo/template-bundler');
var SmartCacheManager = require("./smartcachemanager").SmartCacheManager;
var watchr = require('watchr');
var path = require('path');
var pathManager = require('ncombo/pathmanager');
var portScanner = require('portscanner');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var domain = require('domain');
var fork = require('child_process').fork;

var Master = function (options) {
	var self = this;

	self.EVENT_FAIL = 'fail';
	self.errorDomain = domain.create();
	self.errorDomain.on('error', function () {
		self.errorHandler.apply(self, arguments);
	});
	self.errorDomain.add(self);

	self.start = self.errorDomain.bind(self._start);
	this.init = self.errorDomain.run(function() {
		self._init(options);
	});
};

Master.prototype = Object.create(EventEmitter.prototype);

Master.prototype._init = function (options) {
	var self = this;
	
	self._options = {
		port: 8000,
		workerPorts: null,
		dataPort: null,
		release: false,
		title: 'nCombo App',
		angular: false,
		angularMainModule: null,
		angularMainTemplate: 'index.html',
		protocol: 'http',
		protocolOptions: {},
		transports: ['polling', 'websocket'],
		logLevel: 1,
		connectTimeout: 10,
		sessionTimeout: 1200,
		cacheLife: 2592000,
		cacheType: 'private',
		cacheVersion: null,
		origins: '*:*',
		publicResources: true,
		minifyMangle: false,
		matchOriginProtocol: true,
		addressSocketLimit: null,
		pollingDuration: 30,
		heartbeatInterval: 25,
		heartbeatTimeout: 60,
		allowUploads: false,
		baseURL: null,
		clusterEngine: 'iocluster'
	};

	for (var i in options) {
		self._options[i] = options[i];
	}
	
	if (!self._options.dataPort) {
		self._options.dataPort = self._options.port + 1;
	}
	if (!self._options.workerPorts) {
		self._options.workerPorts = [self._options.port + 2];
	}
	
	self._extRegex = /[.][^\/\\]*$/;
	self._slashSequenceRegex = /\/+/g;
	self._startSlashRegex = /^\//;

	self._clientScriptMap = {};
	self._clientScripts = [];
	self._clientStyles = [];
	self._clientTemplates = [];

	self._bundledResources = [];
	self._resourceSizes = {};

	self._paths = {};

	self._paths.frameworkURL = '/~framework/';

	self._paths.frameworkDirPath = __dirname;
	self._paths.frameworkClientDirPath = self._paths.frameworkDirPath + '/client';
	self._paths.frameworkClientURL = self._paths.frameworkURL + 'client/';

	self._paths.frameworkModulesURL = self._paths.frameworkURL + 'node_modules/';

	self._paths.appDirPath = path.dirname(require.main.filename);
	self._paths.appWorkerControllerPath = self._paths.appDirPath + '/worker.node';

	self._paths.appLoadScriptPath = self._paths.appDirPath + '/scripts/load.js';
	self._paths.frameworkLoadScriptPath = self._paths.frameworkClientDirPath + '/scripts/load.js';
	self._paths.rootTemplateURL = self._paths.frameworkClientURL + 'index.html';

	self._paths.spinJSURL = self._paths.frameworkClientURL + 'libs/spin.js';

	self._appName = path.basename(self._paths.appDirPath);
	
	self._paths.appExternalURL = ('/' + (self._appName || self._options.baseURL) + '/').replace(self._slashSequenceRegex, '/');
	self._paths.appInternalURL = '/';
	self._paths.timeCacheExternalURL = self._paths.appExternalURL + '~timecache';
	self._paths.timeCacheInternalURL = self._paths.appInternalURL + '~timecache';

	pathManager.init(self._paths.frameworkURL, self._paths.frameworkDirPath, self._paths.appDirPath, self._paths.appExternalURL);

	self.useScript = function (url, index) {
		var normalURL = self._normalizeURL(url);
		var filePath = pathManager.urlToPath(normalURL);
		var obj = {};

		if (!self._clientScriptMap[normalURL]) {
			if (self._extRegex.test(url)) {
				obj['url'] = normalURL;
				obj['path'] = filePath;
			} else {
				obj['url'] = url + '.js';
				obj['path'] = filePath + '.js';
			}
			if (index == null) {
				self._clientScripts.push(obj);
			} else {
				self._clientScripts.splice(index, 0, obj);
			}
			self._clientScriptMap[normalURL] = true;
		}
	};

	self.useStyle = function (url) {
		var normalURL = self._normalizeURL(url);
		var filePath = pathManager.urlToPath(normalURL);
		var obj = {};
		if (self._extRegex.test(normalURL)) {
			obj['url'] = normalURL;
			obj['path'] = filePath;
		} else {
			obj['url'] = url + '.css';
			obj['path'] = filePath + '.css';
		}
		self._clientStyles.push(obj);
	};

	self.useTemplate = function (url) {
		var normalURL = self._normalizeURL(url);
		var filePath = pathManager.urlToPath(normalURL);
		var obj = {};
		if (self._extRegex.test(normalURL)) {
			obj['url'] = normalURL;
			obj['path'] = filePath;
		} else {
			obj['url'] = url + '.html';
			obj['path'] = filePath + '.html';
		}

		self._clientTemplates.push(obj);
	};

	self.bundle = {};
	self.bundle.app = {};
	self.bundle.framework = {};
	self.bundle.script = self.useScript;
	self.bundle.style = self.useStyle;
	self.bundle.template = self.useTemplate;

	self.bundle.asset = function (path) {
		var stats = fs.statSync(path);
		var url = pathManager.expand(self._paths.appInternalURL + 'assets/' + name);
		self._resourceSizes[url] = stats.size;
		self._bundledResources.push(url);
	};

	self.bundle.app.lib = function (name, index) {
		self.useScript(self._paths.appInternalURL + 'libs/' + name, index);
	};

	self.bundle.app.template = function (name) {
		self.useTemplate(self._paths.appInternalURL + 'templates/' + name);
	};

	self.bundle.app.style = function (name) {
		self.useStyle(self._paths.appInternalURL + 'styles/' + name);
	};

	self.bundle.app.asset = function (name) {
		var stats = fs.statSync(self._paths.appDirPath + '/assets/' + name);
		var url = pathManager.expand(self._paths.appInternalURL + 'assets/' + name);
		self._resourceSizes[url] = stats.size;
		self._bundledResources.push(url);
	};

	self.bundle.framework.lib = function (name, index) {
		self.useScript(self._paths.frameworkClientURL + 'libs/' + name, index);
	};

	self.bundle.framework.script = function (name, index) {
		self.useScript(self._paths.frameworkClientURL + 'scripts/' + name, index);
	};

	self.bundle.framework.plugin = function (name, index) {
		self.useScript(self._paths.frameworkClientURL + 'plugins/' + name, index);
	};

	self.bundle.framework.style = function (name) {
		self.useStyle(self._paths.frameworkClientURL + 'styles/' + name);
	};

	self.bundle.framework.asset = function (name) {
		var stats = fs.statSync(self._paths.frameworkClientDirPath + '/assets/' + name);
		var url = pathManager.expand(self._paths.frameworkClientURL + 'assets/' + name);
		self._resourceSizes[url] = stats.size;
		self._bundledResources.push(url);
	};
	
	if (self._options.angular) {
		self.bundle.framework.lib('angular.js', 0);
		self._options.angularMainTemplate && self.bundle.app.template(self._options.angularMainTemplate);
	}
	scriptManager.init(self._paths.frameworkURL, self._paths.appExternalURL, self._options.minifyMangle);

	pathManager.setBaseURL(self._paths.appExternalURL);
	scriptManager.setBaseURL(self._paths.appExternalURL);

	self._paths.frameworkSocketIOClientURL = self._paths.frameworkModulesURL + 'socketcluster-client/socketcluster.js';

	self._minAddressSocketLimit = 30;
	self._dataExpiryAccuracy = 5000;

	if (self._options.addressSocketLimit == null) {
		var limit = self._options.sessionTimeout / 10;
		if (limit < self._minAddressSocketLimit) {
			limit = self._minAddressSocketLimit;
		}
		self._options.addressSocketLimit = limit;
	}

	self._clusterEngine = require(self._options.clusterEngine);
	if (!self._options.release && self._options.cacheLife == null) {
		self._options.cacheLife = 86400;
	}

	self._colorCodes = {
		red: 31,
		green: 32,
		yellow: 33
	};

	console.log('   ' + self.colorText('[Busy]', 'yellow') + ' Launching nCombo server');
	if (!self._options.release) {
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
	}

	if (self._options.cacheVersion == null) {
		self._options.cacheVersion = (new Date()).getTime();
	}

	self.useStyle(self._paths.frameworkClientURL + 'styles/ncombo.css');
	self.useScript(self._paths.frameworkClientURL + 'libs/jquery.js');
	self.useScript(self._paths.frameworkModulesURL + 'handlebars/dist/handlebars.js');
	self.useScript(self._paths.frameworkClientURL + 'libs/json2.js');
	self.useScript(self._paths.frameworkURL + 'ncombo-client.js');
};

Master.prototype.errorHandler = function (err) {
	this.emit(this.EVENT_FAIL, err);
	if (err.stack) {
		console.log(err.stack);
	} else {
		console.log(err);
	}
};

Master.prototype._start = function () {
	var self = this;
	
	var appDef = self._getAppDef(true);
	self._options.minifyURLs = [appDef.appScriptsURL, appDef.appLibsURL, appDef.frameworkClientURL + 'scripts/load.js',
		self._paths.frameworkURL + 'ncombo-client.js', self._paths.frameworkURL + 'loader.js',
		self._paths.frameworkURL + 'smartcachemanager.js'
	];

	var bundles = {};
	self._workers = [];

	var stylePaths = [];

	for (var i in self._clientStyles) {
		stylePaths.push(self._clientStyles[i].path);
	}

	var styleDirs = [pathManager.urlToPath(appDef.frameworkStylesURL), pathManager.urlToPath(appDef.appStylesURL)];

	var styleBundle = cssBundler({
		watchDirs: styleDirs,
		files: stylePaths,
		watch: !self._options.release
	});
	self._smartCacheManager = new SmartCacheManager(self._options.cacheVersion);

	if (fs.existsSync(self._paths.appLoadScriptPath)) {
		self._paths.loadScriptURL = pathManager.pathToURL(self._paths.appLoadScriptPath);
	} else {
		self._paths.loadScriptURL = pathManager.pathToURL(self._paths.frameworkLoadScriptPath);
	}

	var newURL;
	var externalAppDef = self._getAppDef();
	var pathToRoot = '../..';

	var cssURLFilter = function (url, rootDir) {
		rootDir = pathManager.toUnixSep(rootDir);
		newURL = pathToRoot + pathManager.pathToURL(rootDir) + '/' + url;
		newURL = pathManager.toUnixSep(path.normalize(newURL));
		if (self._options.release) {
			newURL = self._smartCacheManager.setURLCacheVersion(newURL);
		}

		return newURL;
	};

	var updateCSSBundle = function () {
		var cssBundle = styleBundle.bundle(cssURLFilter);
		if (self._options.release) {
			cssBundle = styleBundle.minify(cssBundle);
		}
		var size = Buffer.byteLength(cssBundle, 'utf8');
		var data;
		for (var i in self._workers) {
			data = {
				url: appDef.appStyleBundleURL,
				content: cssBundle,
				size: size
			};
			self._workers[i].send({
				action: 'updateCache',
				data: data
			});
		}
		bundles[appDef.appStyleBundleURL] = cssBundle;
	};

	var templatePaths = [];

	for (i in self._clientTemplates) {
		templatePaths.push(self._clientTemplates[i].path);
	}

	var templateDirs = [pathManager.urlToPath(appDef.appTemplatesURL)];
	var templateBundle = templateBundler({
		watchDirs: templateDirs,
		files: templatePaths,
		watch: !self._options.release
	});

	var updateTemplateBundle = function () {
		var htmlBundle = templateBundle.bundle();
		var size = Buffer.byteLength(htmlBundle, 'utf8');
		var data;
		for (var i in self._workers) {
			data = {
				url: appDef.appTemplateBundleURL,
				content: htmlBundle,
				size: size
			};
			self._workers[i].send({
				action: 'updateCache',
				data: data
			});
		}
		bundles[appDef.appTemplateBundleURL] = htmlBundle;
	};

	var libPaths = [];
	var jsLibCodes = {};

	for (i in self._clientScripts) {
		libPaths.push(self._clientScripts[i].path);
		jsLibCodes[self._clientScripts[i].path] = fs.readFileSync(self._clientScripts[i].path, 'utf8');
	}

	var makeLibBundle = function () {
		var libArray = [];
		var i;
		for (i in jsLibCodes) {
			if (jsLibCodes[i]) {
				libArray.push(jsLibCodes[i]);
			}
		}
		var libBundle = libArray.join('\n');
		if (self._options.release) {
			libBundle = scriptManager.minify(libBundle);
		}
		bundles[appDef.appLibBundleURL] = libBundle;

		var size = Buffer.byteLength(libBundle, 'utf8');
		var data;
		for (var i in self._workers) {
			data = {
				url: appDef.appLibBundleURL,
				content: libBundle,
				size: size
			};
			self._workers[i].send({
				action: 'updateCache',
				data: data
			});
		}
	};

	var updateLibBundle = function (event, filePath) {
		if (event == 'delete') {
			jsLibCodes[filePath] = null;
		} else if ((event == 'create' || event == 'update') && jsLibCodes.hasOwnProperty(filePath)) {
			jsLibCodes[filePath] = fs.readFileSync(filePath, 'utf8');
		}
		makeLibBundle();
	};

	var bundleOptions = {
		debug: !self._options.release,
		watch: !self._options.release,
		exports: 'require'
	};
	var scriptBundle = browserify(bundleOptions);
	scriptBundle.addEntry(pathManager.urlToPath(appDef.appScriptsURL + 'index.js'));

	var updateScriptBundle = function (callback) {
		var jsBundle = scriptBundle.bundle();
		if (self._options.release) {
			jsBundle = scriptManager.minify(jsBundle);
		}
		bundles[appDef.appScriptBundleURL] = jsBundle;
		var size = Buffer.byteLength(jsBundle, 'utf8');
		var data;
		for (var i in self._workers) {
			data = {
				url: appDef.appScriptBundleURL,
				content: jsBundle,
				size: size
			};
			self._workers[i].send({
				action: 'updateCache',
				data: data
			});
		}
		callback && callback();
	};

	var initBundles = function (callback) {
		updateCSSBundle();
		updateTemplateBundle();
		makeLibBundle();
		updateScriptBundle(callback);
	};

	var autoRebundle = function () {
		// The master process does not handle requests so it's OK to do sync operations at runtime
		styleBundle.on('bundle', function () {
			updateCSSBundle();
		});

		templateBundle.on('bundle', function () {
			updateTemplateBundle();
		});

		watchr.watch({
			paths: [pathManager.urlToPath(appDef.frameworkLibsURL), pathManager.urlToPath(appDef.appLibsURL)],
			listener: updateLibBundle
		});

		scriptBundle.on('bundle', function () {
			updateScriptBundle();
		});
	};

	var minifiedScripts = scriptManager.minifyScripts(self._options.minifyURLs);

	var leaderId = -1;
	var firstTime = true;

	portScanner.checkPortStatus(self._options.port, 'localhost', function (err, status) {
		if (err || status == 'open') {
			console.log('   nCombo Error - Port ' + self._options.port + ' is already taken');
			process.exit();
		} else {
			self._balancer = fork(__dirname + '/ncombo-balancer.node.js');
			console.log('   ' + self.colorText('[Busy]', 'yellow') + ' Launching cluster engine');

			dataPort = self._options.dataPort;
			var pass = crypto.randomBytes(32).toString('hex');

			self._ioClusterServer = new self._clusterEngine.IOClusterServer({
				port: dataPort,
				secretKey: pass,
				expiryAccuracy: self._dataExpiryAccuracy
			});

			self._ioClusterServer.on('ready', function () {
				var i;
				var workerReadyHandler = function (data, worker) {
					self._workers.push(worker);
					if (worker.id == leaderId) {
						worker.send({
							action: 'emit',
							event: self.EVENT_LEADER_START
						});
					}
					if (self._workers.length >= self._options.workerPorts.length && firstTime) {
						console.log('   ' + self.colorText('[Active]', 'green') + ' nCombo server started');
						console.log('            Port: ' + self._options.port);
						console.log('            Mode: ' + (self._options.release ? 'Release' : 'Debug'));
						if (self._options.release) {
							console.log('            Version: ' + self._options.cacheVersion);
						}
						console.log('            Number of workers: ' + self._options.workerPorts.length);
						console.log();
						firstTime = false;

						self._balancer.send({
							action: 'init',
							data: {
								dataKey: pass,
								sourcePort: self._options.port,
								destPorts: self._options.workerPorts
							}
						});
					}
				};

				var launchWorker = function (port, lead) {
					var i;
					var resourceSizes = {};
					for (i in bundles) {
						resourceSizes[i] = Buffer.byteLength(bundles[i], 'utf8');
					}

					var styleAssetSizeMap = styleBundle.getAssetSizeMap();
					for (i in styleAssetSizeMap) {
						// Prepend with the relative path to root from style bundle url (styles will be inserted inside <style></style> tags in root document)
						resourceSizes[externalAppDef.virtualURL + '../..' + i] = styleAssetSizeMap[i];
					}

					var worker = fork(__dirname + '/worker-bootstrap.node');

					var workerOpts = self._cloneObject(self._options);
					workerOpts.appDef = self._getAppDef();
					workerOpts.paths = self._paths;
					workerOpts.workerId = worker.id;
					workerOpts.workerPort = port;
					workerOpts.dataPort = dataPort;
					workerOpts.dataKey = pass;
					workerOpts.minifiedScripts = minifiedScripts;
					workerOpts.bundles = bundles;
					workerOpts.bundledResources = self._bundledResources;
					workerOpts.resourceSizes = resourceSizes;
					workerOpts.lead = lead ? 1 : 0;

					worker.send({
						action: 'init',
						data: workerOpts
					});

					worker.on('message', function workerHandler(data) {
						worker.removeListener('message', workerHandler);
						if (data.action == 'ready') {
							if (lead) {
								leaderId = worker.id;
							}
							workerReadyHandler(data, worker);
						}
					});

					worker.on('exit', function (code, signal) {
						var message = '   Worker ' + worker.id + ' died - Exit code: ' + code;

						if (signal) {
							message += ', signal: ' + signal;
						}

						var newWorkers = [];
						var i;
						for (i in self._workers) {
							if (self._workers[i].id != worker.id) {
								newWorkers.push(self._workers[i]);
							}
						}

						self._workers = newWorkers;

						var lead = worker.id == leaderId;
						leaderId = -1;

						console.log(message);

						if (self._options.release) {
							console.log('   Respawning worker');
							launchWorker(lead);
						} else {
							if (self._workers.length <= 0) {
								console.log('   All workers are dead - nCombo is shutting down');
								process.exit();
							}
						}
					});

					return worker;
				};

				var launchWorkers = function () {
					initBundles(function () {
						var len = self._options.workerPorts.length;
						if (len > 0) {
							launchWorker(self._options.workerPorts[0], true);
							for (var i = 1; i < len; i++) {
								launchWorker(self._options.workerPorts[i]);
							}!self._options.release && autoRebundle();
						}
					});
				};

				launchWorkers();
			});
		}
	});
};

Master.prototype._cloneObject = function (object) {
	var clone = {};
	for (var i in object) {
		clone[i] = object[i];
	}
	return clone;
};

Master.prototype.colorText = function (message, color) {
	if (this._colorCodes[color]) {
		return '\033[0;' + this._colorCodes[color] + 'm' + message + '\033[0m';
	} else if (color) {
		return '\033[' + color + 'm' + message + '\033[0m';
	}
	return message;
};

Master.prototype._getAppDef = function (useInternalURLs) {
	var appDef = {};

	if (useInternalURLs) {
		appDef.appURL = this._paths.appInternalURL;
	} else {
		appDef.appURL = this._paths.appExternalURL;
	}

	appDef.frameworkURL = this._paths.frameworkURL;
	appDef.virtualURL = appDef.appURL + '~virtual/';
	appDef.appStyleBundleURL = appDef.virtualURL + 'styles.css';
	appDef.appTemplateBundleURL = appDef.virtualURL + 'templates.js';
	appDef.appLibBundleURL = appDef.virtualURL + 'libs.js';
	appDef.appScriptBundleURL = appDef.virtualURL + 'scripts.js';
	appDef.frameworkClientURL = this._paths.frameworkClientURL;
	appDef.frameworkLibsURL = this._paths.frameworkClientURL + 'libs/';
	appDef.frameworkAssetsURL = this._paths.frameworkClientURL + 'assets/';
	appDef.pluginsURL = this._paths.frameworkClientURL + 'plugins/';
	appDef.frameworkScriptsURL = this._paths.frameworkClientURL + 'scripts/';
	appDef.loadScriptURL = this._paths.loadScriptURL;
	appDef.frameworkStylesURL = this._paths.frameworkClientURL + 'styles/';
	appDef.appScriptsURL = appDef.appURL + 'scripts/';
	appDef.appLibsURL = appDef.appURL + 'libs/';
	appDef.appStylesURL = appDef.appURL + 'styles/';
	appDef.appTemplatesURL = appDef.appURL + 'templates/';
	appDef.appAssetsURL = appDef.appURL + 'assets/';
	appDef.appFilesURL = appDef.appURL + 'files/';
	appDef.releaseMode = this._options.release;
	appDef.timeout = this._options.connectTimeout * 1000;
	appDef.resourceSizeMap = this._resourceSizes;
	appDef.angular = this._options.angular;
	appDef.angularMainTemplate = this._options.angularMainTemplate;
	appDef.angularMainModule = this._options.angularMainModule;

	return appDef;
};

Master.prototype._normalizeURL = function (url) {
	url = path.normalize(url);
	return url.replace(/\\/g, '/');
};

module.exports.Master = Master;