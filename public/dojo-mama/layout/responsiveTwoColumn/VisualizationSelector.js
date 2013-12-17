define(['dojo/_base/declare',
		'dojo/_base/fx',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/dom-geometry',
		'dojo/dom-style',
		'dojo/fx',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/LinkListItem'],
function(declare, baseFx, kernel, lang, domConstruct, domGeometry, domStyle, fx, EdgeToEdgeList, Button, Pane, BaseListItem, LinkListItem) {
	return declare([Pane], {
		'class': 'stVisualizationSelector',

		list: null,

		scrollOffset: null,
		scrollLeftButton: null,
		scrollRightButton: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.scrollOffset = 0;

			this.scrollLeftButton = new Button({
				'class': 'scrollLeft fa fa-chevron-left',
				'duration': 0,
				'onClick': lang.hitch(this, this.scrollLeft)
			});
			this.scrollLeftButton.placeAt(this.domNode);
			this.scrollLeftButton.startup();

			this.list = new EdgeToEdgeList();
			this.list.placeAt(this.domNode);
			this.list.startup();

			this.scrollRightButton = new Button({
				'class': 'scrollRight fa fa-chevron-right',
				'duration': 0,
				'onClick': lang.hitch(this, this.scrollRight)
			});
			this.scrollRightButton.placeAt(this.domNode);
			this.scrollRightButton.startup();
		},

		scrollLeft: function() {
			this.set('scrollOffset', this.get('scrollOffset') - 1);
		},

		scrollRight: function() {
			this.set('scrollOffset', this.get('scrollOffset') + 1);
		},

		_setScrollOffsetAttr: function(scrollOffset) {

			var vizItems = this.list.getChildren();

			scrollOffset = Math.max(Math.min(scrollOffset, 0), -(vizItems.length - 1));
			this._set('scrollOffset', scrollOffset);
			var firstItem = vizItems[0];

			baseFx.animateProperty({
				'node': firstItem.domNode,
				'properties': {
					'margin-left': scrollOffset * 151,
				}
			}).play();
		},

		startup: function() {
			this.inherited(arguments);

			var i, viz, li;
			for (i = 0; i < kernel.global.dmConfig.visualizations.length; i++) {
				viz = kernel.global.dmConfig.visualizations[i];

				li = new BaseListItem({
					text: viz.charAt(0).toUpperCase() + viz.slice(1)
				});
				li.placeAt(this.list);
				li.startup();
			}
		}
	});
});
