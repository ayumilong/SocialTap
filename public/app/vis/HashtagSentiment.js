/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/dom-geometry',
		'dojo/promise/all',
		'dojo/request/xhr',
		'./Base'
], function(declare, lang, Deferred, domGeom, all, xhr, BaseVis) {
	return declare([BaseVis], {

		// numHashtags: Integer
		//     Number of most popular hashtags to load.
		numHashtags: 25,

		loadData: function(baseQuery) {
			return this.queryDataset(lang.mixin(lang.clone(baseQuery), {
				facets: {
					hashtags: {
						terms: {
							field: 'twitter_entities.hashtags.text',
							size: this.numHashtags
						}
					}
				}
			})).then(lang.hitch(this, function(hashtagsData) {
				var query = lang.clone(baseQuery);
				query.facets = {};

				var hashtags = hashtagsData.facets.hashtags.terms.map(function(t) { return t.term; });
				hashtags.forEach(function(ht) {
					query.facets[ht] = {
						histogram: { field: 'socialtap.sentiment', interval: 1 },
						facet_filter: {
							and: [
								{ term: { 'twitter_entities.hashtags.text': ht } },
								{ exists: { field: 'socialtap.sentiment' } }
							]
						}
					};
				});

				return this.queryDataset(query).then(lang.hitch(this, function(data) {

					var sentMap = { 0: 'negative', 2: 'neutral', 4: 'positive' };

					return hashtags.map(function(ht) {
						var d = {
							text: ht,
							total: 0
						};

						data.facets[ht].entries.forEach(function(e) {
							d[sentMap[e.key]] = e.count;
							d.total += e.count;
						});

						return d;
					});
				}));

			}));
		},

		draw: function(data) {

			var sentiments = ['negative', 'neutral', 'positive'];

			data.forEach(function(d) {
				var y0 = 0;
				d.sentiments = sentiments.map(function(s) {
					return {
						type: s,
						y0: y0,
						y1: y0 += (d[s] / d.total)
					};
				});
			});

			data.sort(function(a, b) { return b.total - a.total; });

			var box = domGeom.getContentBox(this.domNode);

			var margin = {top: 20, right: 80, bottom: 100, left: 60},
				width = box.w - margin.left - margin.right,
				height = box.h - margin.top - margin.bottom;

			var x = d3.scale.ordinal()
				.domain(data.map(function(d) { return d.text; }))
				.rangeRoundBands([0, width], 0.1);

			var y = d3.scale.linear()
				.rangeRound([height, 0]);

			var color = d3.scale.ordinal()
				.domain(sentiments)
				.range(["#d9534f", "#6b486b", "#98abc5"]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickFormat(d3.format(".0%"));

			var svg = d3.select(this.domNode).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
				.selectAll("text")
					.style("text-anchor", "start")
					.attr("transform", "translate(0,3),rotate(45)");

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			var tag = svg.selectAll(".tag")
				.data(data)
				.enter().append("g")
					.attr("class", "tag")
					.attr("transform", function(d) { return "translate(" + x(d.text) + ",0)"; });

			tag.selectAll("rect")
				.data(function(d) { return d.sentiments; })
				.enter().append("rect")
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return y(d.y1); })
					.attr("height", function(d) { return y(d.y0) - y(d.y1); })
					.style("fill", function(d) { return color(d.type); });

			var legend = svg.select(".tag:last-child").selectAll(".legend")
				.data(function(d) { return d.sentiments; })
				.enter().append("g")
					.attr("class", "legend")
					.attr("transform", function(d) { return "translate(" + x.rangeBand() / 2 + "," + y((d.y0 + d.y1) / 2) + ")"; });

			legend.append("line")
				.style("stroke", "black")
				.attr("x1", x.rangeBand() * 0.25)
				.attr("x2", x.rangeBand() / 2 + 10);

			legend.append("text")
				.attr("x", x.rangeBand() / 2 + 10)
				.attr("dy", ".35em")
				.text(function(d) { return d.type; });
		}

	});
});
