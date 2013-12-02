define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/topic',
		'dojox/mobile/Pane'
], function(declare, kernel, lang, domAttr, domClass, domConstruct, domStyle, topic, Pane) {

	// module:
	//     dojo-mama/layout/responsiveTwoColumn/SubNav

	return declare([Pane], {
		// summary:
		//     The sub navigation module

		// backButtonNode: [private] Object
		//     The node containing the mobile view's back button
		backButtonNode: null,

		baseClass: 'dmSubNav',

		// config: [private] Object
		//     The dmConfig object
		config: null,

		// titleNode: [private] Object
		//     The module's title node
		titleNode: null,

		constructor: function() {
			this.config = kernel.global.dmConfig;
		},

		buildRendering: function() {
			// summary:
			//     Build out the sub navigation elements
			this.inherited(arguments);

			/* back button */
			this.backButtonNode = domConstruct.create('a', {
				'class': 'dmSubNavBackButton',
				href: '/',
				innerHTML: '<div></div>'
			}, this.domNode);
			domStyle.set(this.backButtonNode, 'text-decoration', 'none');
			/* title (desktop) */
			this.titleNode = domConstruct.create('span', {
				'class': 'dmSubNavTitle'
			}, this.domNode);

			// ARIA
			domAttr.set(this.titleNode, 'role', 'heading');
			domAttr.set(this.titleNode, 'aria-live', 'polite');
			domAttr.set(this.titleNode, 'tabindex', 0);
			domAttr.set(this.backButtonNode, 'role', 'button');
			domAttr.set(this.backButtonNode, 'tabindex', 0);
			domAttr.set(this.backButtonNode, 'title', 'Back');
		},

		startup: function() {
			this.inherited(arguments);
			/* subscribe to topics */
			topic.subscribe('/dojo-mama/updateSubNav', lang.hitch(this, this.updateSubNav));
		},

		updateSubNav: function(args) {
			// summary:
			//    Updates the sub nav functionality
			// description:
			//    Updates the sub nav
			// args: Object
			//    Args is an object containing parameters for the sub nav:
			//
			//    - back: a string containing the back button route
			//    - title: a string containing the title of the current view
			//
			//    Each key is optional.

			var back = args.back,
				title = args.title;

			// update subnav title
			if (title !== undefined && title !== null) {
				this.titleNode.innerHTML = title;
			}
			// update back button route
			if (back !== undefined) {
				if (back) {
					domClass.remove(this.backButtonNode, 'hidden');
					this.backButtonNode.href = '#' + back;
				}
				else {
					domClass.add(this.backButtonNode, 'hidden');
				}
			}

		}

	});
});
