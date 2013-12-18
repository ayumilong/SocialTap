define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataListPane'],
function(declare, lang, domClass, domConstruct, Button, Pane, BaseListItem, DataListPane) {
	return declare([Pane], {
		'class': 'stDatasetSelector',

		datasetNameNode: null,

		datasetListPane: null,

		toggleListButton: null,

		selectedDataset: null,

		datasets: null,

		onChange: null,

		buildRendering: function() {
			this.inherited(arguments);

			var datasetSelector = this;
			this.datasetListPane = new DataListPane({
				'class': 'stDatasetListPane hidden',
				'dataUrl': '/api/v0/datasets',
				buildListItem: function(dataset) {
					console.log(this);
					var li = new BaseListItem({
						'text': dataset.name,
						'onClick': function() {
							datasetSelector.set('selectedDataset', dataset);
							datasetSelector.closeDatasetList();
						},
						'style': {
							cursor: 'pointer'
						}
					});
					return li;
				}
			});
			this.datasetListPane.placeAt(this.domNode);
			this.datasetListPane.startup();

			this.toggleListButton = new Button({
				'class': 'stToggleListButton fa fa-folder-o',
				'duration': 0,
				'title': 'View Available Datasets'
			});
			this.toggleListButton.placeAt(this.domNode);
			this.toggleListButton.startup();
			this.toggleListButton.set('onClick', lang.hitch(this, this.openDatasetList));

			this.datasetNameNode = domConstruct.create('span', {
				'innerHTML': 'Select Dataset'
			}, this.domNode);
		},

		startup: function() {
			this.inherited(arguments);
		},

		openDatasetList: function() {
			domClass.remove(this.datasetListPane.domNode, 'hidden');
			this.datasetListPane.reloadData();
			domClass.replace(this.toggleListButton.domNode, 'fa-folder-open-o', 'fa-folder-o');
			this.toggleListButton.set('onClick', lang.hitch(this, this.closeDatasetList));
		},

		closeDatasetList: function() {
			domClass.add(this.datasetListPane.domNode, 'hidden');
			domClass.replace(this.toggleListButton.domNode, 'fa-folder-o', 'fa-folder-open-o');
			this.toggleListButton.set('onClick', lang.hitch(this, this.openDatasetList));
		},

		selectDatasetId: function(datasetId) {

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
