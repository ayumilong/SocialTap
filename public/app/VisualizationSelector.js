define(['dojo/_base/declare',
		'dojo/_base/fx',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/dom-geometry',
		'dojo/router',
		'dojo/text!./VisualizationSelector.html',
		'dojo-mama/util/LinkListItem',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'],
function(declare, baseFx, kernel, lang, domAttr, domClass, domConstruct, domGeometry, router, template,
	LinkListItem, _WidgetBase, _TemplatedMixin)
{
	return declare([_WidgetBase, _TemplatedMixin], {
		'class': 'stVisualizationSelector',

		templateString: template,

		datasetId: null,

		listItemWidth: 151,

		scrollOffset: 0,

		visRoutes: null,

		constructor: function() {
			this.visRoutes = kernel.global.config.topNav;
		},

		postCreate: function() {
			this.inherited(arguments);

			var i, navItem;
			for (i = 0; i < this.visRoutes.length; i++) {
				navItem = this.visRoutes[i];
				router.register(navItem.route.replace(':dataset_id', '(\\d+)'), lang.hitch(this, this.handleRoute));
			}

			router.register('*path', lang.hitch(this, this.clearActive));

			window.addEventListener('resize', lang.hitch(this, this.resize));
		},

		handleRoute: function(e) {
			this.set('datasetId', parseInt(e.params[0], 10));

			var children = this.listNode.childNodes;
			var i;
			for (i = 0; i < children.length; i++) {
				domClass.remove(children[i], 'active');
			}

			var navItem;
			for (i = 0; i < this.visRoutes.length; i++) {
				navItem = this.visRoutes[i];
				if (navItem.route.replace(':dataset_id', e.params[0]) == e.newPath) {
					domClass.add(this.listNode.childNodes[i], 'active');
					break;
				}
			}
		},

		clearActive: function(e) {
			// If this route doesn't match any viz routes, clear the active class from all viz list items
			var i, navItem, match = false;
			for (i = 0; i < this.visRoutes.length; i++) {
				navItem = this.visRoutes[i];
				if (e.newPath.match(new RegExp(navItem.route.replace(':dataset_id', '\\d+')))) {
					match = true;
					break;
				}
			}
			if (!match) {
				var children = this.listNode.childNodes;
				for (i = 0; i < children.length; i++) {
					domClass.remove(children[i], 'active');
				}
			}
		},

		scrollLeft: function() {
			this.set('scrollOffset', this.get('scrollOffset') + 1);
		},

		scrollRight: function() {
			this.set('scrollOffset', this.get('scrollOffset') - 1);
		},

		minScrollOffset: function() {
			var listWidth = this.listItemWidth * this.listNode.childNodes.length;
			var availableWidth = domGeometry.getMarginBox(this.listNode).w;
			return Math.min(Math.floor((availableWidth - listWidth) / this.listItemWidth), 0);
		},

		resize: function() {
			this.inherited(arguments);
			var minOffset = this.minScrollOffset();
			if (this.scrollOffset < minOffset) {
				this.set('scrollOffset', minOffset);
			}
			this.setScrollButtonsEnabled();
		},

		setScrollButtonsEnabled: function() {
			if (this.scrollOffset === this.minScrollOffset()) {
				domAttr.set(this.scrollRightButton, 'disabled', 'disabled');
			}
			else {
				domAttr.remove(this.scrollRightButton, 'disabled');
			}

			if (this.scrollOffset === 0) {
				domAttr.set(this.scrollLeftButton, 'disabled', 'disabled');
			}
			else {
				domAttr.remove(this.scrollLeftButton, 'disabled');
			}
		},

		_setScrollOffsetAttr: function(scrollOffset) {

			scrollOffset = Math.max(Math.min(scrollOffset, 0), this.minScrollOffset());
			this._set('scrollOffset', scrollOffset);

			baseFx.animateProperty({
				'node': this.listNode.childNodes[0],
				'properties': {
					'margin-left': scrollOffset * this.listItemWidth,
				}
			}).play();

			this.setScrollButtonsEnabled();
		},

		_setDatasetIdAttr: function(datasetId) {
			this._set('datasetId', datasetId);

			domConstruct.empty(this.listNode);

			if (datasetId) {
				domClass.remove(this.scrollLeftButton, 'hidden');
				domClass.remove(this.scrollRightButton, 'hidden');

				var i, navItem, li;

				for (i = 0; i < this.visRoutes.length; i++) {
					navItem = this.visRoutes[i];

					li = new LinkListItem({
						text: navItem.title,
						href: '#' + navItem.route.replace(':dataset_id', this.datasetId)
					});
					li.placeAt(this.listNode);
				}

				this.setScrollButtonsEnabled();
			}
			else {
				domClass.add(this.scrollLeftButton, 'hidden');
				domClass.add(this.scrollRightButton, 'hidden');
			}
		}
	});
});
