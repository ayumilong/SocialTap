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
		'./SubNav'
], function(declare, kernel, lang, win, Deferred, domAttr, domConstruct, topic,
	WidgetBase, mobile, Pane, ModuleManager, Analytics, MenuBar, SubNav) {

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

		// menuBar: [private] Object
		//     The secondary navigation
		menuBar: null,

		// mode: [private] String
		//    Either 'phone' or 'tablet'
		mode: null,

		// moduleContent: [private] Object
		//    Container node for modules
		moduleContent: null,

		// moduleManager: [private] Object
		//    Class that controls the launching and routing of modules
		moduleManager: null,

		// screenSizeReady: [private] Object
		//    A deferred that is resolved when the screen size is detected
		screenSizeReady: null,

		// subNav: [private] Object
		//    Horizontal bar containing the mobile back button,
		//    secondary module selection, and view titles
		subNav: null,

		// titleBar: [private] Object
		//    Horizontal bar containing the application's title
		titleBar: null,

		// titleHeading: [private] Object
		//    The application's title
		titleHeading: null,

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
			// the splitter consists of two panes
			this.leftPane = new Pane({baseClass: 'dmLeftPane'});
			// hide the layout initially to prevent flashing in mobile view of right pane
			this.domNode.style.display = 'none';

			this.titleBar = new Pane({baseClass: 'dmTitle'});
			this.titleHeading = domConstruct.create('a', {
				'class': 'dmTitleHeading',
				innerHTML: this.config.title,
				href: '#' + this.config.baseRoute
			}, this.titleBar.domNode);
			this.titleBar.placeAt(this.domNode);

			this.subNav = new SubNav();
			this.subNav.placeAt(this.domNode);

			// and a container for module content
			this.moduleContent = new Pane({baseClass: 'dmModuleContent'});
			this.config.moduleContentNode = this.moduleContent.domNode;
			this.moduleContent.placeAt(this.domNode);

			// create the menu bar (attach it later)
			this.menuBar = new MenuBar();
			this.menuBar.placeAt(this.titleBar);

			// ARIA
			domAttr.set(this.titleHeading, 'aria-label', this.config.titleLabel);
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
			this.subNav.startup();
			this.menuBar.startup();
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

		showBothPanes: function() {
			// summary:
			//     Show both panes and update the layout accordingly
			// tags:
			//     private

			this.leftPane.domNode.style.display = '';
			this.rightPane.domNode.style.display = '';
			this.menuBar.placeAt(this.metaNav.domNode);
			domConstruct.place(this.titleHeading, this.titleBar.domNode, 'first');
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
