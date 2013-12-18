define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/topic',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataPane',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/util/ScrollablePane'],
function(declare, kernel, lang, domClass, domConstruct, topic, Button, EdgeToEdgeList, Pane, BaseListItem, DataPane, LinkListItem, ScrollablePane) {
	return declare([DataPane], {
		'class': 'stDatasetSelector',

		datasetNameNode: null,

		toggleListButton: null,

		selectedDataset: null,

		datasets: null,

		dataUrl: '/api/v0/datasets',

		list: null,

		listPane: null,

		navRoute: null,

		onChange: null,

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

			topic.subscribe('/dojo-mama/routeEvent', lang.hitch(this, this.handleRoute));
		},

		handleRoute: function(e) {
			var i, navItem, match, datasetId;
			for (i = 0; i < kernel.global.dmConfig.topNav.length; i++) {
				navItem = kernel.global.dmConfig.topNav[i];
				match = e.newPath.match(new RegExp('/' + navItem.route.replace(':dataset_id', '(\\d)')));
				if (match != null) {
					datasetId = parseInt(match[1], 10);
					this.selectedDatasetId = datasetId;
					if (this.datasets) {
						this.datasets.forEach(lang.hitch(this, function(ds) {
							if (ds.id == datasetId) {
								this.set('selectedDataset', ds);
							}
						}));
					}
				}
			}
		},

		beforeLoad: function() {
			this.list.destroyDescendants();
		},

		handleData: function(datasets) {
			this.datasets = datasets;

			var createClickHandler = lang.hitch(this, function(li, index) {
				li.set('onClick', lang.hitch(this, function() {
					this.set('selectedDataset', this.datasets[index]);
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
				createClickHandler(li, i);
				this.list.addChild(li);
				li.startup();

				if (this.selectedDatasetId == datasets[i].id) {
					this.set('selectedDataset', datasets[i]);
				}
			}
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

		_setSelectedDatasetAttr: function(selectedDataset) {
			this._set('selectedDataset', selectedDataset);

			this.datasetNameNode.innerHTML = selectedDataset.name;

			if (this.onChange) {
				this.onChange(selectedDataset.id);
			}
		},

		_setNavRouteAttr: function(navRoute) {
			this._set('navRoute', navRoute);

			var lis = this.list.getChildren();
			var i;
			for (i = 0; i < lis.length; i++) {
				lis[i].set('href', '#/' + navRoute.replace(':dataset_id', this.selectedDataset.id));
			}
		}
	});
});
