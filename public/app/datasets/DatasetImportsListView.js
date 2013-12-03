define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo/topic',
		'dojox/mobile/Button',
		'dojo-mama/util/LinkListItem',
		'dojo-mama/util/toaster',
		'app/datasets/ImportOpListItem',
		'app/util/Select',
		'app/util/XHRListView'
], function(declare, lang, domConstruct, xhr, topic, Button, LinkListItem, toaster,
	ImportOpListItem, Select, XHRListView)
{
	return declare([XHRListView], {

		'class': 'datasetImportsListView',

		// dataset: Object
		//     The dataset whose imports to show.
		dataset: null,

		datasetPromise: null,

		// newImportSourceSelect: Object
		//     Menu for selecting the data source for a new import.
		newImportSourceSelect: null,

		noResultsMessage: 'No imports into this dataset',

		parentView: '/',

		route: '/(\\d+)/imports',

		// startImportButton: Object
		//     Button to start a new import with the selected source.
		startImportButton: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('div', {
				'class': 'dmListDivider',
				innerHTML: 'Start Importing Data',
				style: {
					marginTop: '15px'
				}
			}, this.domNode);

			this.newImportSourceSelect = new Select();
			this.newImportSourceSelect.placeAt(this.domNode);
			this.newImportSourceSelect.startup();
			this.loadDataSources();

			domConstruct.create('label', {
				'for': this.newImportSourceSelect.get('id'),
				innerHTML: 'Source:'
			}, this.newImportSourceSelect.domNode, 'before');

			this.startImportButton = new Button({
				'class': 'button',
				duration: 0,
				label: 'Start',
				onClick: lang.hitch(this, this.startImport)
			});
			this.startImportButton.placeAt(this.domNode);
			this.startImportButton.startup();
		},

		buildListItem: function(obj) {
			var li = new ImportOpListItem({
				importOp: obj
			});
			return li;
		},

		dataUrlFromRoute: function(e) {
			return '/api/v0/datasets/' + e.params[0] + '/imports';
		},

		loadDataSources: function() {
			xhr.get('/api/v0/data_sources', {
				handleAs: 'json'
			}).then(
				lang.hitch(this, function(data) {
					var i, label, options = {}, type, typeOptions;
					for (type in data) {
						if (data.hasOwnProperty(type)) {
							typeOptions = [];
							for (i = 0; i < data[type].length; i++) {

								label = '';
								if (type === 'FileDataSource') {
									label = data[type][i].file_data_source_file.path;
								}
								else if (type === 'GnipDataSource') {
									label = data[type][i].gnip_data_source_rule.value;
								}

								typeOptions.push({
									value: data[type][i].id,
									label: label
								});
							}
							options[type.replace(/DataSource$/, '')] = typeOptions;
						}
					}
					this.newImportSourceSelect.set('options', options);
				}),
				lang.hitch(this, function(err) {
					console.error(err);
					toaster.displayMessage({
						text: 'Unable to load data sources',
						type: 'error',
						time: -1
					});
				}));
		},

		_setDatasetAttr: function(/*Object*/ dataset) {
			this._set('dataset', dataset);

			if (dataset !== null) {
				this.set('title', 'Imports into ' + dataset.name);
				topic.publish('/dojo-mama/updateSubNav', {
					back: this.module.getAbsoluteRoute('/' + dataset.id)
				});
			}
			else {
				this.set('title', 'Imports into Dataset');
				topic.publish('/dojo-mama/updateSubNav', {
					back: this.module.getAbsoluteRoute('/')
				});
			}
		},

		startImport: function() {
			// summary:
			//     Attempt to start a new import from the selected data source into this dataset.
			if (this.get('dataset')) {
				xhr.post('/api/v0/import_operations', {
					handleAs: 'json',
					data: JSON.stringify({
						import_operation: {
							dataset_id: this.get('dataset').id,
							data_source_id: this.newImportSourceSelect.get('value')
						}
					}),
					headers: {
						'Content-Type': 'application/json',
					}
				}).response.then(
					lang.hitch(this, function(response) {
						this.refreshData();
					}),
					lang.hitch(this, function(err) {
						console.error(err);
					}));
			}
		},

		activate: function(e) {
			this.inherited(arguments);

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
