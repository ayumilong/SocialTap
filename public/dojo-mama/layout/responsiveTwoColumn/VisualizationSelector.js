define(['dojo/_base/declare',
		'dojo/_base/fx',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-geometry',
		'dojo/router',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/LinkListItem'],
function(declare, baseFx, kernel, lang, domAttr, domClass, domGeometry, router, EdgeToEdgeList, Button, Pane, LinkListItem) {
	return declare([Pane], {
		'class': 'stVisualizationSelector',

		list: null,

		datasetId: null,

		scrollOffset: 0,
		scrollLeftButton: null,
		scrollRightButton: null,

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
			for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
				navItem = kernel.global.dmConfig.topNav[i];
				router.register(navItem.route.replace(':dataset_id', '(\\d+)'), lang.hitch(this, this.handleRoute));
			}
		},

		handleRoute: function(e) {
			this.set('datasetId', parseInt(e.params[0], 10));
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

				for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
					navItem = kernel.global.dmConfig.topNav[i];

					li = new LinkListItem({
						text: navItem.label,
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
