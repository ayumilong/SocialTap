define(['dojo/_base/declare',
		'dojo/_base/fx',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/dom-geometry',
		'dojo/dom-style',
		'dojo/fx',
		'dojo/topic',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/LinkListItem'],
function(declare, baseFx, kernel, lang, domClass, domConstruct, domGeometry, domStyle, fx, topic, EdgeToEdgeList, Button, Pane, BaseListItem, LinkListItem) {
	return declare([Pane], {
		'class': 'stVisualizationSelector',

		list: null,

		datasetId: null,

		onChange: null,

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

			topic.subscribe('/dojo-mama/routeEvent', lang.hitch(this, this.handleRoute));
		},

		handleRoute: function(e) {
			var i, navItem, match;
			for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
				navItem = kernel.global.dmConfig.topNav[i];
				match = e.newPath.match(new RegExp('/' + navItem.route.replace(':dataset_id', '(\\d)')));
				if (match != null) {
					this.datasetId = parseInt(match[1], 10);
					this.reloadList();
				}
			}
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

		reloadList: function() {
			this.list.destroyDescendants();

			var i, navItem, li;

			var createClickHandler = lang.hitch(this, function(li, navItem) {
				li.set('onClick', lang.hitch(this, function() {
					if (this.onChange) {
						this.onChange(navItem);
					}
				}));
			});

			for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
				navItem = kernel.global.dmConfig.topNav[i];

				li = new LinkListItem({
					text: navItem.label,
					href: '#/' + navItem.route.replace(':dataset_id', this.datasetId)
				});
				createClickHandler(li, navItem);
				li.placeAt(this.list);
				li.startup();
			}
		},

		_setOnChangeAttr: function(onChange) {
			this._set('onChange', onChange);
			this.reloadList();
		},

		_setDatasetIdAttr: function(datasetId) {
			this._set('datasetId', datasetId);

			this.list.destroyDescendants();

			if (datasetId) {
				domClass.remove(this.domNode, 'hidden');
				this.reloadList();
			}
			else {
				domClass.add(this.domNode, 'hidden');
			}
		}
	});
});
