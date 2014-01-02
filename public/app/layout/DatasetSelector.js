define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/router',
		'dojo/topic',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataPane',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/util/ScrollablePane',
		'app/visConfig'],
function(declare, kernel, lang, domClass, domConstruct, on, router, topic, Button, EdgeToEdgeList,
	Pane, BaseListItem, DataPane, LinkListItem, ScrollablePane, visConfig)
{
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

		newDatasetOnClickHandle: null,

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

			var newDatasetLink = domConstruct.create('a', {
				'class': 'newDatasetLink',
				'href': '#/datasets/create',
				'innerHTML': 'Create New Dataset'
			}, this.listPane.domNode);

			this.newDatasetOnClickHandle = on(newDatasetLink, 'click', lang.hitch(this, function() {
				this.closeDatasetList();
			}));

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
			for (i = 0; i < visConfig.visualizations.length; i++) {
				navItem = visConfig.visualizations[i];
				router.register(navItem.route.replace(':dataset_id', '(\\d+)'), lang.hitch(this, this.handleRoute));
			}
		},

		handleRoute: function(e) {
			this.closeDatasetList();
			this.set('selectedDatasetId', parseInt(e.params[0], 10));

			this.set('navRoute', e.newPath.replace('/' + e.params[0], '/:dataset_id'));

			console.warn(e);
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
					//'href': '#' + (this.navRoute ? this.navRoute.replace(':dataset_id', datasets[i].id) : '/datasets/' + datasets[i].id),
					'href': '#' + (this.navRoute ? this.navRoute.replace(':dataset_id', datasets[i].id) : '/vis/browse/' + datasets[i].id),
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

		destroy: function() {
			if (this.newDatasetOnClickHandle) {
				this.newDatasetOnClickHandle.remove();
				this.newDatasetOnClickHandle = null;
			}
			this.inherited(arguments);
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
