define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/Button',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Pane',
		'dojo-mama/util/toaster',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, lang, domAttr, domConstruct, xhr, Button, EdgeToEdgeList, Pane, toaster, ModuleScrollableView) {
	return declare([ModuleScrollableView], {

		'class': 'datasetView',

		browseLink: null,

		// dataset: Object
		//     The dataset to display.
		dataset: null,

		// datasetPromise: Object
		//     Promise for loading dataset from API
		datasetPromise: null,

		infoPane: null,

		visList: null,

		parentView: '/',

		route: '/(\\d+)',

		buildRendering: function() {
			this.inherited(arguments);

			this.infoPane = new Pane();
			this.infoPane.placeAt(this.domNode);
			this.infoPane.startup();

			this.browseLink = domConstruct.create('a', {
				'class': 'button',
				innerHTML: 'Browse Data'
			}, this.domNode);

			var deleteButton = new Button({
				'class': 'button',
				label: 'Delete Dataset',
				onClick: lang.hitch(this, this.onDeleteClicked),
				style: {
					marginLeft: '10px'
				}
			});
			deleteButton.placeAt(this.domNode);
			deleteButton.startup();

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Search',
				style: {
					marginTop: '15px'
				}
			}, this.domNode);

			domConstruct.create('p', {
				innerHTML: 'Search form here'
			}, this.domNode);

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Visualize'
			}, this.domNode);

			this.visList = new EdgeToEdgeList();
			this.visList.placeAt(this.domNode);
			this.visList.startup();

			domConstruct.create('p', {
				innerHTML: 'List of available visualizations here'
			}, this.domNode);

		},

		_setDatasetAttr: function(/*Object*/ dataset) {
			this._set('dataset', dataset);

			this.set('title', dataset ? dataset.name : 'View Dataset');

			this.infoPane.domNode.innerHTML = dataset ? ('<p>' + dataset.description + '</p>') : '';

			if (dataset) {
				domAttr.set(this.browseLink, 'href', '#/datasets/' + dataset.id + '/browse');
			}
			else {
				domAttr.remove(this.browseLink, 'href');
			}

			this.visList.destroyDescendants();
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

			console.warn(e);

			if (this.datasetPromise !== null) {
				this.datasetPromise.cancel();
			}

			toaster.clearMessages();
			this.datasetPromise = xhr.get('/api/v0/datasets/' + e.params[0] + '.json', {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.datasetPromise = null;
					this.set('dataset', response.data);
				}),
				lang.hitch(this, function(err) {
					this.datasetPromise = null;
					console.error(err);

					this.set('dataset', null);

					if (err.response.status == 404) {
						toaster.displayMessage({
							text: 'Dataset not found',
							type: 'warning',
							time: -1
						});
					}
					else {
						toaster.displayMessage({
							text: 'An unknown error occurred',
							type: 'error',
							time: -1
						});
					}
				}));
		}
	});
});
