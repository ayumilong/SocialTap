define(['dojo/_base/declare',
		'dojo/_base/window',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/query',
		'dojo-mama/Module',
		'app/index/RootView'
		//'dojo-mama/layout/responsiveTwoColumn/index/Module'
], function(declare, win, domClass, domConstruct, query, Module, RootView) {
	return declare([Module], {

		postCreate: function() {
			this.inherited(arguments);

			// Use the base router instead of the monkey-patched module router
			this.router = this.routerBase;

			this.rootView = new RootView({
				route: '/'
			});

			this.registerView(this.rootView);
		},

		activate: function() {
			this.inherited(arguments);
			domClass.add(win.body(), 'dmRootView');
		},

		deactivate: function() {
			domClass.remove(win.body(), 'dmRootView');
			this.inherited(arguments);
		}

	});
});
