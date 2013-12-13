define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojo/topic',
		'dojox/mobile/Button',
		'dojo-mama/util/toaster',
		'app/datasets/ImportOpListItem',
		'app/util/Select',
		'app/util/XHRListView'
], function(declare, lang, domConstruct, xhr, topic, Button, toaster, ImportOpListItem, Select,
	XHRListView)
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
