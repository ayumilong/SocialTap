define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/_base/window',
		'dojo/Deferred',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/topic',
		'dijit/_WidgetBase',
		'dojox/mobile',
		'dojox/mobile/Pane',
		'dojo-mama/ModuleManager',
		'dojo-mama/util/Analytics',
		'./MenuBar',
		'./SubNav',
		'./DatasetSelector',
		'./VisualizationSelector'
], function(declare, kernel, lang, win, Deferred, domAttr, domConstruct, topic,
	WidgetBase, mobile, Pane, ModuleManager, Analytics, MenuBar, SubNav, DatasetSelector, VisualizationSelector) {

	// module:
	//     dojo-mama/layout/responsiveTwoColumn/Layout

	return declare([WidgetBase], {
		// summary:
		//     Generates the application framework layout from a dmConfig object.

		// analytics: [private] Object
		//     Google Analytics integration module
		analytics: null,

		baseClass: 'dmLayout',

		// config: [private] Object
		//     The dmConfig config object
		config: null,

		// layoutReady: [private] Deferred
		//     Resolved when the first module is focused
		layoutReady: null,

		// mode: [private] String
		//    Either 'phone' or 'tablet'
		mode: null,

		// moduleContent: [private] Object
		//    Container node for modules
		moduleContent: null,

		// moduleManager: [private] Object
		//    Class that controls the launching and routing of modules
		moduleManager: null,

		datasetSelector: null,

		// screenSizeReady: [private] Object
		//    A deferred that is resolved when the screen size is detected
		screenSizeReady: null,

		vizSelector: null,

		constructor: function(/*Object*/ args) {
			// summary:
			//      Creates a new Layout
			// args:
			//      The dmConfig object

			var config = args.config;
			// mixin some default configuration
			config.index = config.index || {moduleId: 'dojo-mama/layout/responsiveTwoColumn/index/Module'};
			config.networkTimeout = config.networkTimeout || 15000;
			config.modules['404'] = config.modules['404'] || {moduleId: 'dojo-mama/layout/responsiveTwoColumn/404/Module'};
			config.transitionDuration = config.transitionDuration || 250;
			config.baseRoute = '/';
			// expose the config globally
			kernel.global.dmConfig = this.config = config;

			// instantiante the module manager
			this.moduleManager = new ModuleManager({
				getMode: lang.hitch(this, this.getMode),
				focusModule: lang.hitch(this, this.focusModule)
			});

			// instantiate Google Analytics wrapper
			this.analytics = new Analytics();
		},

		buildRendering: function() {
			// summary:
			//     Build out the layout elements
			// tags:
			//     protected

			this.inherited(arguments);

			// hide the layout initially to prevent flashing in mobile view of right pane
			this.domNode.style.display = 'none';

			this.datasetSelector = new DatasetSelector();
			this.datasetSelector.placeAt(this.domNode);

			this.vizSelector = new VisualizationSelector();
			this.vizSelector.placeAt(this.domNode);

			this.datasetSelector.set('onChange', lang.hitch(this, function(datasetId) {
				this.vizSelector.set('datasetId', datasetId);

				// Oh, the horror!
				// This updates the current visualization when a different dataset is selected.
				// So if you're viewing 'Browse' for dataset ID 3, and select dataset ID 4, this will
				// route to 'Browse' for dataset ID 4.
				kernel.global.dmConfig.topNav.forEach(lang.hitch(this, function(navItem) {
					var matches = window.location.hash.match(new RegExp('#/' + navItem.route.replace(':dataset_id', '(\\d)')));
					if (matches != null) {
						window.location = '#/' + navItem.route.replace(':dataset_id', datasetId);
					}
				}));
			}));

			this.vizSelector.set('onChange', lang.hitch(this, function(navItem) {
				this.datasetSelector.set('navRoute', navItem.route);
			}));

			// and a container for module content
			this.moduleContent = new Pane({baseClass: 'dmModuleContent'});
			this.config.moduleContentNode = this.moduleContent.domNode;
			this.moduleContent.placeAt(this.domNode);



			// ARIA
			domAttr.set(this.moduleContent.domNode, 'tabindex', 0);
			domAttr.set(this.moduleContent.domNode, 'role', 'main');
		},

		startup: function() {
			// summary:
			//     Place the layout in the DOM
			// tags:
			//     protected

			this.inherited(arguments);
			this.layoutReady = new Deferred();
			this.screenSizeReady = new Deferred();
			this.datasetSelector.startup();
			this.vizSelector.startup();
			this.analytics.startup();

			// place the layout into the dom
			this.placeAt(win.body(), 'first');

			// subscribe to screens size events and other topics
			topic.subscribe('/dojox/mobile/screenSize/phone', lang.hitch(this, this.layoutPhone));
			topic.subscribe('/dojox/mobile/screenSize/tablet', lang.hitch(this, this.layoutTablet));

			// detect layout and transform UI
			mobile.detectScreenSize(true);

			// this.screenSizeReady is resolved after the screenSize topic is published
			this.screenSizeReady.then(
				lang.hitch(this, function(mode) {
					this.mode = mode;
					this.moduleManager.startup();
				}),
				function() {
					console.error('Cannot detect screensize');
				});

			return this.layoutReady;
		},

		getActiveModuleName: function() {
			// summary:
			//     Return the module manager's active module name
			// tags:
			//     private

			var activeModule = this.moduleManager.activeModule;
			return activeModule && activeModule.name;
		},

		layoutPhone: function() {
			// summary:
			//     Adjust layout for mobile/phone
			// tags:
			//     callback private

			// on the first layout, resolve screenSizeReady and startup module manager
			if (!this.mode) {
				this.screenSizeReady.resolve('phone');
				return;
			}
			this.mode = 'phone';

			console.log('laying out phone');
		},

		layoutTablet: function() {
			// summary:
			//     Adjust layout for tablet/desktop
			// tags:
			//     callback private

			// on the first layout, resolve screenSizeReady and startup module manager
			if (!this.mode) {
				this.screenSizeReady.resolve('tablet');
				return;
			}
			this.mode = 'tablet';

			console.log('laying out tablet');
		},

		getMode: function() {
			// summary:
			//     Return the layouts current mode, 'phone' or 'tablet'
			return this.mode;
		},

		focusModule: function(/*module*/) {
			// summary:
			//     When the first module is focused, resolves the layoutReady promise.
			// module:
			//     The module instance to focus
			// tags:
			//     callback private

			if (!this.layoutReady.isFulfilled()) {
				this.layoutReady.resolve();
				this.domNode.style.display = '';
			}
		}
	});
});
