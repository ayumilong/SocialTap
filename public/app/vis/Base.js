/*global requestAnimationFrame*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dijit/_WidgetBase',
], function(declare, lang, domConstruct, xhr, WidgetBase) {
	return declare([WidgetBase], {

		// active: Boolean
		//     Whether or not this visualization is currently visible.
		active: null,

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
			if (!this.active) {
				return;
			}
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
		}
	});
});
