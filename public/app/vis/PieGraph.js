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


		buildRendering: function () {
			this.inherited(arguments);
			this.searchTermInput = domConstruct.create('input', {'type' : 'text',
			   	'value' : '',
				'style' : 'position: absolute; top: 5px; left 5px; z-index: 1; width: 100px' }
				, this.domNode);
		},

		buildElasticsearchQuery: function(/*Object*/query) {
			// summary:
			//    Subclasses should override this method to provide the Elasticsearch query
			//    necessary for the visualization.
			// baseQuery: Object
			//    Elasticsearch query with filter built from current inquiry.
			var searchTerm = this.searchTermInput.value;
			this.startVar = false;
		//	console.log(searchTerm);
			if(!searchTerm){
				console.log("No Search Term");
				return query;
			}
		//	console.log(query);
			this.startVar = true;
			return lang.mixin(query, {"aggs" : {
			    "displayName" : { 
				"filter" : {"term" : {"actor.displayName" : searchTerm }}
			    },
			    "tweetBody" : {
				"filter" : {"term" : {"body" : searchTerm } }
			    },
			    "hashtags" : { 
				"filter" : {"term" : {"twitter_entities.hashtags.text" : searchTerm } }
			    }
			    }});},

		draw: function(data) {
			/*jshint unused:false*/
			// summary:
			//     Subclasses should override this method to draw the visualization.
			// data:
			//     Data returned from loadData promise.
			
			//hardcode data to get the visualization working before elasticsearch
			
			console.dir(data);
			var width = 800;
			var height = 800;
			var color = d3.scale.category10();
			var displayData;
			if(!this.startVar){
				displayData = [
				{"data" : 1, "label" : "Usernames"},
				{"data" : 1, "label" : "Hashtags"},
				{"data" : 1, "label" : "Body Hits"}];
				
			}
			else{
				var hashtagHits = data.aggregations.hashtags.doc_count;
				var userHits = data.aggregations.displayName.doc_count;
				var bodyHits = data.aggregations.tweetBody.doc_count;
					//.range(["red", "blue", "purple", ]);
				displayData = [
				{"data" : userHits, "label" : "Usernames"},
				{"data" : hashtagHits, "label" : "Hashtags"},
				{"data" : bodyHits, "label" : "Body Hits"}];
			}
			var r = 200;


			//appending an svg onto the primary canvas of the webpage
			var svg = d3.select(this.domNode).append("svg")
				.attr("width", 1000)
				.attr("height", 1000)
				.attr("position", "absolute")
				.attr("z-index", -1);
			
			var group = svg.append("g")
				.attr("transform", "translate(" + width/2 + "," + height/3 + ")");

			var arc = d3.svg.arc()
				.innerRadius(r - (9*r/10))
				.outerRadius(r);


			var pie = d3.layout.pie()
				.value(function(d) { return  d.data; });

			var arcs = group.selectAll(".arc")
				.data(pie(displayData))
				.enter()
				.append("g")
				.attr("class", "arc");

			arcs.append("path")
				.attr("d", arc)
				.attr("fill", function (d) { return(color(d.data.data)); })
				.attr("stroke", "black")
				.attr("stroke-width", "5");

			arcs.append("text")
				.attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
				.attr("text-anchor", "middle")
				.attr("font-size", "1.5em")
				.text(function (d) { return d.data.label;});

			arcs.append("text")
				.attr("transform", function (d) { 
					var textCoords = arc.centroid(d);
					textCoords[1] = textCoords[1] + 30;
					return "translate(" + textCoords + ")"; })
				.attr("text-anchor", "middle")
				.attr("font-size", "1.5em")
				.text(function (d) { return d.data.data;});

			//Drawing the search box
			this.inherited(arguments);
			this.searchTermInput = domConstruct.create('input', {'type' : 'text',
			   	'value' : 'search',
				'style' : 'position: absolute; top: 5px; left: 15px; z-index: 1; width: 100px' }
				, this.domNode);

			var searchButton = domConstruct.create('input', {
						'type' : 'button',
						'value' : 'Search',
						'width' : 100,
						'style' : 'position: absolute; top: 50px; left: 15px; z-index: 1; width: 80px',
						'onclick': lang.hitch(this, this.reload)
						}, this.domNode);	



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

		//returns a json object from a query on the right sidebar
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
			if (this.data) {
				domConstruct.empty(this.domNode);
				this.draw(this.data);
			}
		},

		reload: function() {
			this.emit('display_info', '');

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
