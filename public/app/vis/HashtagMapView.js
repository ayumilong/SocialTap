/*global $,d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo-mama/views/ModuleScrollableView',
		'app/vis/VisBaseView.js',
		'app/util/SearchBar',
		'app/vis/jsPlugin!static/d3.js',
		'app/vis/jsPlugin!static/d3.layout.cloud.js'
], function(declare, lang, domConstruct, ModuleScrollableView, VisBaseView, SearchBar) {
	return declare([VisBaseView], {

		'class': 'hashtagMapView',
		parentView: '/',
		route: '/hashtags/:dataset',
		title: 'Hashtag Map',

		fill: d3.scale.category20(),
		levels: 10,
		numEntries: 100,

		wordMapNode: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.searchBar = new SearchBar({
				placeHolder: 'Name or username',
				onSearch: lang.hitch(this, function(searchText) {

				})
			});

			this.searchBar.placeAt(this.domNode);
			this.searchBar.startup();

			this.wordMapNode = domConstruct.create('div', {
				'id': "wordMap"
			}, this.domNode);

		},

		activate: function(e) {
			this.inherited(arguments);
			this.set('datasetId', e.params.dataset);

			domConstruct.empty(this.wordMapNode);

			this.drawWordMap();
			/*if (e.params.query) {
				domClass.add(this.instructionsNode, 'hidden');
				this.searchBar.set('value', decodeURIComponent(e.params.query));
				this.search(e.params.query);
			}
			else {
				domClass.remove(this.instructionsNode, 'hidden');
				this.searchBar.focus();
			}*/
		},

		drawWordMap: function() {
			var that = this;
			var query = {
			    "elasticsearch": {
					"facets" : {
						"hash_tags" : {
							"terms" : {
								"field": "twitter_entities.hashtags.text",
								"size": this.numEntries
							}
						}
					}
			    }
			};
			this.es(query, that.prepareToDrawMap);
			/*$.ajax({
		        url: "http://localhost:3000/api/v0/datasets/1/search.json",
		        type: 'POST',
		        crossDomain: true,
		        dataType: 'json',
		        data: JSON.stringify(query),
		        success: function(data) {
					console.log(data);
					that.prepareToDrawMap(data);
				},
		        error: function(data) {
					console.log(data);
				}
		    });*/
		},
		prepareToDrawMap: function(data) {
			var that = this;
			var hashtags = data.facets.hash_tags.terms;
			var wordSize;
			var i = 0;
			var maxHeight = 60;
			var minHeight = 10;
			var scale = maxHeight - minHeight;
			var level = this.levels;
			d3.layout.cloud().size([1000, 1000])
				.words(hashtags.map(function(d) {
					if (i >= that.numEntries/that.levels) {
						i = 0;
						level = level - 1;
					}
					wordSize = ((level/that.levels)*scale) + minHeight;
			        console.log(level + "/" + that.levels + "*" + scale + "+" + minHeight + "=" + wordSize);
					i = i + 1;
					return {text: d.term, size: wordSize};
				}))
				.padding(2)
				.rotate(function() { return 0; })
				.font("Impact")
				.fontSize(function(d) { return d.size; })
				.on("end", that.draw)
				.start();
		},
		draw: function(words) {
			d3.select("#wordMap").append("svg")
				.attr("width", 1000)
				.attr("height", 1000)
			.append("g")
				.attr("transform", "translate(500,500)")
			.selectAll("text")
		        .data(words)
			.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Impact")
				.style("fill", function(d, i) { return d3.scale.category20(i); })
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; });
		}

	});
});
