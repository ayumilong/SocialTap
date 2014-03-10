/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/promise/all',
		'dojo/request/xhr',
		'dojo/dom-construct',
		'./Base'
], function(declare, lang, domGeometry, all, xhr, domConstruct, BaseVis) {
	return declare([BaseVis], {

		loadData: function(baseQuery) {
			return this.queryDataset(lang.mixin(baseQuery, {
				facets: {
					times: {
						date_histogram: { field: "postedTime", interval: "1h" }
					},
					negative: {
						date_histogram: { field: "postedTime", interval: "1h" },
						facet_filter: {
							and: [
								{ exists: { field: "socialtap.sentiment"  } },
								{ term: { "socialtap.sentiment": 0 } }
							]
						}
					},
					neutral: {
						date_histogram: { field: "postedTime", interval: "1h" },
						facet_filter: {
							and: [
								{ exists: { field: "socialtap.sentiment"  } },
								{ term: { "socialtap.sentiment": 2 } }
							]
						}
					},
					positive: {
						date_histogram: { field: "postedTime", interval: "1h" },
						facet_filter: {
							and: [
								{ exists: { field: "socialtap.sentiment"  } },
								{ term: { "socialtap.sentiment": 4 } }
							]
						}
					}
				}
			})).then(function(data) {
				return {
					buckets: data.facets.times.entries.map(function(e) { return e.time; }),
					sentiments: ["negative", "neutral", "positive"].map(function(s) {
						return {
							type: s.charAt(0).toUpperCase() + s.slice(1),
							entries: data.facets.times.entries.map(function(t) {
								var entry = data.facets[s].entries.filter(function(e) { return e.time == t.time; })[0];
								return { time: t.time, count: (entry && entry.count) || 0 };
							})
						};
					})
				};
			});
		},

		draw: function(data) {

			var box = domGeometry.getContentBox(this.domNode);
			var margin = { top: 20, right: 10, bottom: 50, left: 60 };
			var width = box.w - margin.left - margin.right;
			var height = box.h - margin.top - margin.bottom;

			var svg = d3.select(this.domNode)
				.append('svg')
					.attr('width', box.w)
					.attr('height', box.h)
				.append('g')
					.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var stack = d3.layout.stack()
				.offset('zero')
				.values(function(d) { return d.entries; })
				.x(function(d) { return d.time; })
				.y(function(d) { return d.count; });

			var layers = stack(data.sentiments);

			var x = d3.time.scale()
				.domain(d3.extent(data.buckets, function(d) { return new Date(d); }))
				.range([0, width]);

			var y = d3.scale.linear()
				.domain([0, d3.max(layers, function(layer) { return d3.max(layer.entries, function(d) { return d.y0 + d.y; }); })])
				.range([height, 0]);

			var xAxis = d3.svg.axis().scale(x).orient('bottom');
			var yAxis = d3.svg.axis().scale(y).orient('left');

			svg.append('g')
					.attr('class', 'x axis')
					.attr('transform', 'translate(0,' + height + ')')
					.call(xAxis);

			svg.append('g')
				.attr('class', 'y axis')
				.call(yAxis);

			var area = d3.svg.area()
				.x(function(d) { return x(new Date(d.time)); })
				.y0(function(d) { return y(d.y0); })
				.y1(function(d) { return y(d.y0 + d.y); });

			var color = d3.scale.ordinal()
				.domain(['Negative', 'Neutral', 'Positive'])
				.range(["#d9534f", "#6b486b", "#98abc5"]);

			svg.append('g').selectAll('path')
				.data(layers).enter()
				.append('path')
					.attr('d', function(d) { return area(d.entries); })
					.style('fill', function(d) { return color(d.type); });

		}
	});
});
