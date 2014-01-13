/*global requestAnimationFrame*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojo/request/xhr',
		'dijit/_WidgetBase',
], function(declare, lang, domConstruct, Evented, xhr, WidgetBase) {

	return declare([WidgetBase, Evented], {
		// summary:
		//     Base class for visualizations. Handles loading data from API. Subclasses should
		//     override buildElasticsearchQuery and draw. See documentation for those methods
		//     for details.

		'class': 'vis',

		// dataPromise: Object
		//     Promise for data being loaded from API. Used to cancel request if loadData is
		//     called again before the previous load was finished.
		dataPromise: null,

		// datasetId: Integer
		//     ID of dataset to run inquiry against.
		datasetId: null,

		// detailsPane: Object
		//     Pane for displaying extra information about visualization content.
		detailsPane: null,

		// es_query: Object
		//     Elastisearch query built from inquiry and vis options.
		elasticsearchQuery: null,

		// data: Object
		//     Data received from API for current dataset/inquiry.
		data: null,


		options: null,

		// redrawOnResize: Boolean
		//     Whether or not to clear and redraw the visualization when this widget is resized.
		redrawOnResize: true,

		buildElasticsearchQuery: function(/*Object*/baseQuery) {
			// summary:
			//    Subclasses should override this method to provide the Elasticsearch query
			//    necessary for the visualization.
			// baseQuery: Object
			//    Elasticsearch query with filter built from current inquiry.
			return baseQuery;
		},

		draw: function(data) {
			/*jslint unparam: true*/
			// summary:
			//     Subclasses should override this method to draw the visualization.
			// data:
			//     Reponse from Elasticsearch.
		},

		handleData: function(response) {
			this.dataPromise = null;
			this.set('data', response.data);
		},

		handleError: function(err) {
			this.dataPromise = null;
			if (err.dojoType !== 'cancel') {
				console.error(err);
			}
		},

		redraw: function() {
			domConstruct.empty(this.domNode);
			this.draw(this.data);
		},

		reload: function() {
			if (!this.datasetId) {
				console.error('Cannot load data without a dataset ID');
				return;
			}

			if (this.dataPromise !== null) {
				this.dataPromise.cancel();
			}

			this.set('data', null);
			this.dataPromise = xhr.post('/api/v0/datasets/' + this.datasetId + '/search', {
				data: JSON.stringify({elasticsearch: this.elasticsearchQuery}),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response
			.then(lang.hitch(this, this.handleData), lang.hitch(this, this.handleError));
		},

		resize: function() {
			this.inherited(arguments);
			if (this.redrawOnResize && this.data) {

				// When resizing the window, this event will be fired many times in a row. To
				// improve performance, only redraw on an animation frame.
				if (this.redrawScheduled !== true) {
					requestAnimationFrame(lang.hitch(this, function() {
						this.redraw();
						this.redrawScheduled = false;
					}));
					this.redrawScheduled = true;
				}
			}
		},

		_setDataAttr: function(/*Object*/data) {
			// summary:
			//     Redraw visualization with new data.
			this._set('data', data);
			if (data) {
				this.redraw();
			}
		},

		_setElasticsearchQueryAttr: function(/*Object*/query) {
			// summary:
			//     Accept base query from inquiry form and add this
			//     visualization's extra parameters to it.

			// Minimal query matches all results.
			if (!query) {
				query = {
					query: {
						match_all: {}
					}
				};
			}

			query = this.buildElasticsearchQuery(query);

			this._set('elasticsearchQuery', query);
		},

		_getOptionsAttr: function() {

			if (!this.options) {
				return null;
			}

			// Mix current value of each option into returned array.
			var opts = [];
			var i;
			for (i = 0; i < this.options.length; i++) {
				opts.push(lang.mixin(this.options[i], { currentValue: this.get(this.options[i].name) }));
			}

			return opts;
		},

		_setOptionsAttr: function(/*Array*/options) {
			this._set('options', options);
			this.emit('optionsChanged', options);
		}
	});
});
