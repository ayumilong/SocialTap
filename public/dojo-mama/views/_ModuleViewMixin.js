define(['dojo/_base/declare',
		'dojo/dom-class',
		'dojo/topic',
		'dojo-mama/util/toaster'
], function(declare, domClass, topic, toaster) {

	// module:
	//     dojo-mama/views/ModuleViewBase

	return declare([], {
		// summary:
		//     A base module view

		// active: Boolean
		//     Represents the state of this view
		active: false,
		// route: String
		//     The route to match to show this view
		route: null,
		// router: Object
		//     A module-relative dojo/router provided by dojo-mama/Module upon view registration
		router: null,

		buildRendering: function() {
			this.inherited(arguments);
			domClass.add(this.domNode, ['dmModuleView']);
			this.domNode.style.display = 'none';
		},

		postCreate: function() {
			// summary:
			//     Override postCreate with your module's content
			// tags:
			//     extension
			this.inherited(arguments);
			if (this.route === null) {
				console.error('Module route not defined');
				return;
			}
		},

		activate: function(/*Object*/ e) {
			// summary:
			//     Called when a view is shown, settings this.active to true
			// e:
			//     The dojo/router event

			this.set('active', true);
			topic.publish('/dojo-mama/analytics',
					'send', 'event', 'activateView',
					e.newPath);
			topic.publish('/dojo-mama/analytics',
					'send', 'event', 'activateViewRoute',
					this.module.getAbsoluteRoute(this.route));
		},

		deactivate: function() {
			// summary:
			//     Called when a view is hidden, settings this.active to false
			this.set('active', false);
			toaster.clearMessages();
		}

	});
});
