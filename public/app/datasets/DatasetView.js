define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/DataPane',
		'dojo-mama/util/toaster',
		'dojo-mama/views/BaseView',
		'dojo-mama/views/ModuleScrollableView',
		'app/datasets/ImportOpListItem'
], function(declare, lang, domAttr, domConstruct, xhr, Button, EdgeToEdgeList, Pane, DataPane, toaster, BaseView, ModuleScrollableView, ImportOpListItem) {
	return declare([BaseView, DataPane], {

		'class': 'datasetView',

		// dataset: Object
		//     The dataset to display.
		dataset: null,

		infoPane: null,

		parentView: '/',

		route: '/(\\d+)',

		buildRendering: function() {
			this.inherited(arguments);

			this.infoPane = new Pane();
			this.infoPane.placeAt(this.contentNode);
			this.infoPane.startup();

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Data Imports',
				style: {
					marginTop: '15px'
				}
			}, this.contentNode);

			this.importsList = new EdgeToEdgeList();
			this.importsList.placeAt(this.contentNode);
			this.importsList.startup();

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Edit',
				style: {
					marginTop: '15px'
				}
			}, this.contentNode);

			var deleteButton = new Button({
				'class': 'button',
				label: 'Delete Dataset',
				onClick: lang.hitch(this, this.onDeleteClicked),
				style: {
					marginLeft: '10px'
				}
			});
			deleteButton.placeAt(this.contentNode);
			deleteButton.startup();

		},

		beforeLoad: function() {
			domConstruct.empty(this.infoPane.domNode);
			this.importsList.destroyDescendants();
		},

		handleData: function(dataset) {
			console.warn(dataset);
			this.set('dataset', dataset);

			this.set('title', dataset ? dataset.name : 'View Dataset');

			this.infoPane.domNode.innerHTML = dataset ? ('<p>' + (dataset.description || 'No description') + '</p>') : '';

			var i, li;
			for (i = 0; i < dataset.import_operations.length; i++) {
				li = new ImportOpListItem({
					importOp: dataset.import_operations[i]
				});
				this.importsList.addChild(li);
				li.startup();
			}
		},

		onDeleteClicked: function() {
			console.warn('Delete button clicked');

			if (this.get('dataset') == null) {
				return;
			}

			if (confirm('Are you sure you want to delete this dataset? This cannot be undone.')) {
				toaster.clearMessages();
				toaster.displayMessage({
					text: 'Deleting dataset...',
					type: 'information',
					time: -1
				});
				xhr.del('/api/v0/datasets/' + this.get('dataset').id).response.then(
					lang.hitch(this, function(response) {
						console.log(response);
						toaster.clearMessages();
						this.router.go('/');
					}),
					lang.hitch(this, function(err) {
						console.error(err);
						toaster.clearMessages();
						toaster.displayMessage({
							text: 'An unknown error occurred.',
							type: 'error',
							time: -1
						});
					}));
			}

		},

		activate: function(e) {
			this.inherited(arguments);
			this.set('dataUrl', '/api/v0/datasets/' + e.params[0]);
		}
	});
});
