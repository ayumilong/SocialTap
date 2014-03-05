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
			/*jslint unparam: true*/
			// summary:
			//     Subclasses should override this method to draw the visualization.
			// data:
			//     Reponse from Elasticsearch.
		},

		handleData: function(response) {
			this.dataPromise = null;
			this.emit('display_info', 'Inquiry matched ' + response.data.hits.total + ' items');
			this.set('data', response.data);
		},

		handleError: function(err) {
			this.dataPromise = null;
			if (err.dojoType !== 'cancel') {
				console.error(err);
			}
		},

		postCreate: function() {
			this.inherited(arguments);
			on(window, 'resize', lang.hitch(this, this.resize));
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
				data: JSON.stringify({elasticsearch: this.buildElasticsearchQuery(lang.clone(this.baseQuery))}),
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

		_setBaseQueryAttr: function(/*Object*/baseQuery) {
			// Minimal query matches all results.
			if (!baseQuery) {
				baseQuery = {
					query: {
						match_all: {}
					}
				};
			}

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
