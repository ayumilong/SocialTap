/*global requestAnimationFrame*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojo/on',
		'dojo/request/xhr',
		'dijit/_WidgetBase',
		'../util/staticjs!static/d3.js'
], function(declare, lang, domConstruct, Evented, on, xhr, WidgetBase) {

	return declare([WidgetBase, Evented], {
		// summary:
		//     Base class for visualizations. Handles loading data from API. Subclasses should
		//     override buildElasticsearchQuery and draw. See documentation for those methods
		//     for details.

		'class': 'vis',

		// baseQuery: Object
		//     Elasticsearch query and filters from inquiry.
		baseQuery: null,

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

		// data: Object
		//     Data received from API for current dataset/inquiry.
		data: null,

		// isLoading: Boolean
		//     Whether or not this visualization is in the process of loading data.
		isLoading: false,

		// options: Array
		//     Array of options for a visualization.
		//     [
		//        {
		//           name: Key for option in vis class
		//           label: Label for input
		//           allowedValues: [
		//              {
		//                 label: Label for option in select
		//                 value: Value to set option to
		//              }
		//           ]
		//        }
		//     ]
		//
		//     This is used to create inputs for changing visualization options. When a
		//     visualization is displayed, the options pane in the sidebar will update with
		//     inputs to change its options. If the 'allowed_values' key is specified for an
		//     option, a select box will be shown. Otherwise, a text input. When an input value
		//     changes, set(option.name, input value) will be called on the visualization object.
		//
		//     When this.get('options') is called, another key 'currentValue' will be mixed in
		//     with the value returned by this.get(option.name).
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
			/*jshint unused:false*/
			// summary:
			//     Subclasses should override this method to draw the visualization.
			// data:
			//     Data returned from loadData promise.
		},

		handleLoadError: function(err) {
			// summary:
			//     Handle errors loading data.
			if (err.dojoType !== 'cancel') {
				console.error(err);
			}
		},

		loadData: function(baseQuery) {
			// summary:
			//     Load data necessary for drawing. Return a promise resolved with the data which
			//     will be passed to draw.
			// baseQuery:
			//     Base query from inquiry.
			return this.queryDataset(this.buildElasticsearchQuery(baseQuery));
		},

		postCreate: function() {
			this.inherited(arguments);
			on(window, 'resize', lang.hitch(this, this.resize));
		},

		queryDataset: function(query) {
			return xhr.post('/api/v0/datasets/' + this.datasetId + '/search', {
				data: JSON.stringify({elasticsearch: query}),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			});
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

			if (this.dataPromise) {
				this.dataPromise.cancel();
			}

			this.set('data', null);
			this.dataPromise = this.loadData(lang.clone(this.baseQuery));
			this.dataPromise
				.then(lang.hitch(this, function(data) {
					this.dataPromise = null;
					this.set('data', data);
				}), lang.hitch(this, function(err) {
					this.dataPromise = null;
					this.handleLoadError(err);
				}));
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

		_setBaseQueryAttr: function(/*Object*/baseQuery) {
			// Minimal query matches all results.
			if (!baseQuery) {
				baseQuery = {
					query: {
						match_all: {}
					},
				};
			}

			baseQuery.size = 0;

			this._set('baseQuery', baseQuery);
		},

		_setDataAttr: function(/*Object*/data) {
			// summary:
			//     Redraw visualization with new data.
			this._set('data', data);
			if (data) {
				this.redraw();
			}
		},

		_getOptionsAttr: function() {

			if (!this.options) {
				return null;
			}

			return this.options.map(lang.hitch(this, function(opt) {
				return lang.mixin(opt, { currentValue: this.get(opt.name) });
			}));
		}
	});
});
