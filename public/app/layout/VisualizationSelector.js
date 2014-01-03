define(['dojo/_base/declare',
		'dojo/_base/fx',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-geometry',
		'dojo/router',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/LinkListItem'],
function(declare, baseFx, lang, domAttr, domClass, domGeometry, router, EdgeToEdgeList,
	Button, Pane, LinkListItem)
{
	return declare([Pane], {
		'class': 'stVisualizationSelector',

		list: null,

		datasetId: null,

		scrollOffset: 0,
		scrollLeftButton: null,
		scrollRightButton: null,

		visRoutes: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.scrollLeftButton = new Button({
				'class': 'scrollLeft fa fa-chevron-left hidden',
				'duration': 0,
				'onClick': lang.hitch(this, this.scrollLeft)
			});
			this.scrollLeftButton.placeAt(this.domNode);
			this.scrollLeftButton.startup();

			this.list = new EdgeToEdgeList();
			this.list.placeAt(this.domNode);
			this.list.startup();

			this.scrollRightButton = new Button({
				'class': 'scrollRight fa fa-chevron-right hidden',
				'duration': 0,
				'onClick': lang.hitch(this, this.scrollRight)
			});
			this.scrollRightButton.placeAt(this.domNode);
			this.scrollRightButton.startup();

			var i, navItem;
			for (i = 0; i < this.visRoutes.length; i++) {
				navItem = this.visRoutes[i];
				router.register(navItem.route.replace(':dataset_id', '(\\d+)'), lang.hitch(this, this.handleRoute));
			}

			router.register('/*path', lang.hitch(this, this.clearActive));
		},

		handleRoute: function(e) {
			this.set('datasetId', parseInt(e.params[0], 10));

			this.list.getChildren().forEach(function(li) {
				domClass.remove(li.domNode, 'active');
			});

			var i, navItem;
			for (i = 0; i < this.visRoutes.length; i++) {
				navItem = this.visRoutes[i];
				if (navItem.route.replace(':dataset_id', e.params[0]) == e.newPath) {
					domClass.add(this.list.getChildren()[i].domNode, 'active');
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
				this.list.getChildren().forEach(function(li) {
					domClass.remove(li.domNode, 'active');
				});
			}
		},

		scrollLeft: function() {
			this.set('scrollOffset', this.get('scrollOffset') + 1);
		},

		scrollRight: function() {
			this.set('scrollOffset', this.get('scrollOffset') - 1);
		},

		minScrollOffset: function() {
			var listWidth = 151 * this.list.getChildren().length;
			var availableWidth = domGeometry.getMarginBox(this.list.domNode).w;
			return Math.min(Math.floor((availableWidth - listWidth) / 151), 0);
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
				domAttr.set(this.scrollRightButton.domNode, 'disabled', 'disabled');
			}
			else {
				domAttr.remove(this.scrollRightButton.domNode, 'disabled');
			}

			if (this.scrollOffset === 0) {
				domAttr.set(this.scrollLeftButton.domNode, 'disabled', 'disabled');
			}
			else {
				domAttr.remove(this.scrollLeftButton.domNode, 'disabled');
			}
		},

		_setScrollOffsetAttr: function(scrollOffset) {

			var vizItems = this.list.getChildren();

			scrollOffset = Math.max(Math.min(scrollOffset, 0), this.minScrollOffset());
			this._set('scrollOffset', scrollOffset);
			var firstItem = vizItems[0];

			baseFx.animateProperty({
				'node': firstItem.domNode,
				'properties': {
					'margin-left': scrollOffset * 151,
				}
			}).play();

			console.warn('scroll offset = ' + scrollOffset);

			this.setScrollButtonsEnabled();
		},

		_setDatasetIdAttr: function(datasetId) {
			this._set('datasetId', datasetId);

			this.list.destroyDescendants();

			if (datasetId) {
				domClass.remove(this.scrollLeftButton.domNode, 'hidden');
				domClass.remove(this.scrollRightButton.domNode, 'hidden');

				var i, navItem, li;

				for (i = 0; i < this.visRoutes.length; i++) {
					navItem = this.visRoutes[i];

					li = new LinkListItem({
						text: navItem.title,
						href: '#' + navItem.route.replace(':dataset_id', this.datasetId)
					});
					li.placeAt(this.list);
					li.startup();
				}

				this.setScrollButtonsEnabled();
			}
			else {
				domClass.add(this.scrollLeftButton.domNode, 'hidden');
				domClass.add(this.scrollRightButton.domNode, 'hidden');
			}
		}
	});
});
