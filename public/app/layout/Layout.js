define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/topic',
		'dijit/_WidgetBase',
		'dojox/mobile',
		'dojox/mobile/Pane',
		'./DatasetSelector',
		'./VisualizationSelector',
		'../visConfig'
], function(declare, lang, domAttr, topic, WidgetBase, mobile, Pane, DatasetSelector, VisualizationSelector, visConfig) {

	// module:
	//     app/layout/Layout

	return declare([WidgetBase], {

		baseClass: 'dmLayout',

		// mode: [private] String
		//    Either 'phone' or 'tablet'
		mode: null,

		// moduleContent: [private] Object
		//    Container node for modules
		moduleContent: null,

		buildRendering: function() {
			// summary:
			//     Build out the layout elements
			// tags:
			//     protected

			this.inherited(arguments);

			// Copy array so we're not modifying the original.
			var visRoutes = visConfig.visualizations.slice(0);
			visRoutes.unshift({
				title: 'Info',
				route: '/datasets/:dataset_id'
			});

			var datasetSelector = new DatasetSelector({
				visRoutes: visRoutes
			});
			datasetSelector.placeAt(this.domNode);

			var vizSelector = new VisualizationSelector({
				visRoutes: visRoutes
			});
			vizSelector.placeAt(this.domNode);

			// and a container for module content
			this.moduleContent = new Pane({
				baseClass: 'dmModuleContent'
			});
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

			// subscribe to screens size events and other topics
			topic.subscribe('/dojox/mobile/screenSize/phone', lang.hitch(this, this.layoutPhone));
			topic.subscribe('/dojox/mobile/screenSize/tablet', lang.hitch(this, this.layoutTablet));

			// detect layout and transform UI
			mobile.detectScreenSize(true);
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
			this.mode = 'phone';
			console.log('laying out phone');
		},

		layoutTablet: function() {
			// summary:
			//     Adjust layout for tablet/desktop
			// tags:
			//     callback private
			this.mode = 'tablet';
			console.log('laying out tablet');
		},

		getMode: function() {
			// summary:
			//     Return the layouts current mode, 'phone' or 'tablet'
			return this.mode;
		}
	});
});
