define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/router',
		'dojo/topic',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataPane',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/util/ScrollablePane'],
function(declare, kernel, lang, domClass, domConstruct, router, topic, Button, EdgeToEdgeList, Pane, BaseListItem, DataPane, LinkListItem, ScrollablePane) {
	return declare([DataPane], {
		'class': 'stDatasetSelector',

		datasetNameNode: null,

		toggleListButton: null,

		selectedDatasetId: null,

		datasets: null,

		dataUrl: '/api/v0/datasets',

		list: null,

		listPane: null,

		navRoute: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.listPane = new ScrollablePane({
				'class': 'stDatasetListPane hidden',
			});
			this.listPane.placeAt(this.contentNode);
			this.listPane.startup();

			this.list = new EdgeToEdgeList();
			this.list.placeAt(this.listPane.domNode);
			this.list.startup();

			this.toggleListButton = new Button({
				'class': 'stToggleListButton fa fa-folder-o',
				'duration': 0,
				'title': 'View Available Datasets'
			});
			this.toggleListButton.placeAt(this.contentNode);
			this.toggleListButton.startup();
			this.toggleListButton.set('onClick', lang.hitch(this, this.openDatasetList));

			this.datasetNameNode = domConstruct.create('span', {
				'innerHTML': 'Select Dataset'
			}, this.contentNode);

			var i, navItem;
			for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
				navItem = kernel.global.dmConfig.topNav[i];
				router.register(navItem.route, lang.hitch(this, this.handleRoute));
			}
		},

		handleRoute: function(e) {
			this.set('selectedDatasetId', e.params.dataset_id);
		},

		beforeLoad: function() {
			this.list.destroyDescendants();
		},

		handleData: function(datasets) {
			this.datasets = datasets;

			var createClickHandler = lang.hitch(this, function(li, datasetId) {
				li.set('onClick', lang.hitch(this, function() {
					this.set('selectedDatasetId', datasetId);
					this.closeDatasetList();
				}));
			});

			var i, li;
			for (i = 0; i < datasets.length; i++) {
				li = new LinkListItem({
					'text': datasets[i].name,
					'href': '#/datasets/' + datasets[i].id,
					'style': {
						cursor: 'pointer'
					}
				});
				createClickHandler(li, datasets[i].id);
				this.list.addChild(li);
				li.startup();
			}

			// Now that data has loaded
			this.set('selectedDatasetId', this.selectedDatasetId);
		},

		openDatasetList: function() {
			domClass.remove(this.listPane.domNode, 'hidden');
			this.reloadData();
			domClass.replace(this.toggleListButton.domNode, 'fa-folder-open-o', 'fa-folder-o');
			this.toggleListButton.set('onClick', lang.hitch(this, this.closeDatasetList));
		},

		closeDatasetList: function() {
			domClass.add(this.listPane.domNode, 'hidden');
			domClass.replace(this.toggleListButton.domNode, 'fa-folder-o', 'fa-folder-open-o');
			this.toggleListButton.set('onClick', lang.hitch(this, this.openDatasetList));
		},

		_setSelectedDatasetIdAttr: function(selectedDatasetId) {
			this._set('selectedDatasetId', selectedDatasetId);

			if (this.datasets) {
				var i;
				for (i = 0; i < this.datasets.length; i++) {
					if (this.datasets[i].id == selectedDatasetId) {
						this.datasetNameNode.innerHTML = this.datasets[i].name;
					}
				}
			}
		},

		_setNavRouteAttr: function(navRoute) {
			this._set('navRoute', navRoute);

			var lis = this.list.getChildren();
			var i;
			for (i = 0; i < lis.length; i++) {
				lis[i].set('href', '#' + navRoute.replace(':dataset_id', this.selectedDatasetId));
			}
		}
	});
});
