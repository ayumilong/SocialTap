/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'./Base',
		'../util/staticjs!static/d3.js',
		'../util/staticjs!static/d3.layout.cloud.js'
], function(declare, lang, domGeom, BaseVis) {
	return declare([BaseVis], {

		numLevels: 10,

		numEntries: 100,

		buildElasticsearchQuery: function(query) {
			query.facets = {
				words: {
					terms: {
						field: "twitter_entities.hashtags.text",
						size: this.numEntries
					}
				}
			};
			return query;
		},

		draw: function(data) {
			var size = domGeom.getContentBox(this.domNode);
			var wordSize;
			var i = 0;
			var maxHeight = 60;
			var minHeight = 10;
			var scale = maxHeight - minHeight;
			var numEntries = this.numEntries;
			var numLevels = this.numLevels;
			var level = numLevels;
			d3.layout.cloud().size([size.w, size.h])
				.words(data.facets.words.terms.map(function(d) {
					if (i >= numEntries / numLevels) {
						i = 0;
						level = level - 1;
					}
					wordSize = ((level / numLevels) * scale) + minHeight;
					i = i + 1;
					return {text: d.term, size: wordSize};
				}))
				.padding(2)
				.rotate(function() { return 0; })
				.font("Impact")
				.fontSize(function(d) { return d.size; })
				.on("end", lang.hitch(this, this.drawWords))
				.start();
		},

		drawWords: function(words) {
			d3.select(this.domNode).append("svg")
				.attr("width", "100%")
				.attr("height", "100%")
			.append("svg") // Center cloud in view
				.attr("x", "50%")
				.attr("y", "50%")
				.style("overflow", "visible")
			.append("g")
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
