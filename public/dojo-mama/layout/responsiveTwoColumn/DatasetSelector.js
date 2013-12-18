define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataPane',
		'dojo-mama/util/ScrollablePane'],
function(declare, lang, domClass, domConstruct, Button, EdgeToEdgeList, Pane, BaseListItem, DataPane, ScrollablePane) {
	return declare([DataPane], {
		'class': 'stDatasetSelector',

		datasetNameNode: null,

		toggleListButton: null,

		selectedDataset: null,

		datasets: null,

		dataUrl: '/api/v0/datasets',

		list: null,

		listPane: null,

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
		},

		beforeLoad: function() {
			this.list.destroyDescendants();
		},

		handleData: function(datasets) {
			var i, dataset, li;

			console.warn(datasets);

			this.datasets = datasets;

			var createClickHandler = lang.hitch(this, function(li, index) {
				li.set('onClick', lang.hitch(this, function() {
					this.set('selectedDataset', this.datasets[index]);
					this.closeDatasetList();
				}));
			});

			for (i = 0; i < datasets.length; i++) {
				li = new BaseListItem({
					'text': datasets[i].name,
					'style': {
						cursor: 'pointer'
					}
				});
				createClickHandler(li, i);
				this.list.addChild(li);
				li.startup();
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
		}
	});
});
