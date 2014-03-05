/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/dom-style',
		'dojo/request/xhr',
		'./Base'
], function(declare, lang, domGeom, domStyle, xhr, BaseVis) {
	return declare([BaseVis], {

		buildElasticsearchQuery: function(query) {
			query.facets = {
				tweetsPerDay: {
					date_histogram: {
						field: "postedTime",
						interval: "1d"
					}
				}
			};
			return query;
		},

		draw: function(esResults) {

			domStyle.set(this.domNode, {
				shapeRendering: 'crispEdges'
			});

			var day = d3.time.format.utc("%w");
			var week = d3.time.format.utc("%U");
			var year = d3.time.format.utc("%Y");
			var format = d3.time.format.utc("%Y-%m-%d");

			var data = {};
			esResults.facets.tweetsPerDay.entries.forEach(function(d) {
				data[ format(new Date(d.time)) ] = d.count;
			});

			// Calculate min and max years in data
			var yearRange = d3.extent(esResults.facets.tweetsPerDay.entries, function(d) { return d.time; }).map(function(d) { return parseInt(year(new Date(d))); });
			yearRange = yearRange.filter(function(y, i) { return yearRange.indexOf(y) == i; });

			var box = domGeom.getContentBox(this.domNode);
			var width = box.w;
			var height = 136 / 960 * width;
			var cellSize = 17 / 960 * width; // cell size

			var color = d3.scale.quantize()
				.domain(d3.extent(d3.values(data)))
				.range(["rgb(165,0,38)",
						"rgb(215,48,39)",
						"rgb(244,109,67)",
						"rgb(253,174,97)",
						"rgb(254,224,139)",
						"rgb(255,255,191)",
						"rgb(217,239,139)",
						"rgb(166,217,106)",
						"rgb(102,189,99)",
						"rgb(26,152,80)",
						"rgb(0,104,55)"]);

			var svg = d3.select(this.domNode).selectAll("svg")
				.data(yearRange)
				.enter().append("svg")
					.attr("width", width)
					.attr("height", height)
					.attr("class", "RdYlGn")
					.append("g")
						.attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

			svg.append("text")
				.attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
				.style("text-anchor", "middle")
				.text(function(d) { return d; });

			var rect = svg.selectAll(".day")
				.data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
				.enter().append("rect")
					.style("fill", "#fff")
					.style("stroke", "#ccc")
					.attr("width", cellSize)
					.attr("height", cellSize)
					.attr("x", function(d) { return week(d) * cellSize; })
					.attr("y", function(d) { return day(d) * cellSize; })
					.datum(format);

			rect.append("title")
				.text(function(d) { return d; });

			svg.selectAll(".month")
				.data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
				.enter().append("path")
					.style("fill", "none")
					.style("stroke", "#000")
					.style("stroke-width", "2px")
					.attr("class", "month")
					.attr("d", monthPath);

			rect.filter(function(d) { return d in data; })
				.style("fill", function(d) { return color(data[d]); })
				.select("title")
					.text(function(d) { return d + ": " + data[d] + ' tweets'; });

			function monthPath(t0) {
				var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
				var d0 = +day(t0), w0 = +week(t0);
				var d1 = +day(t1), w1 = +week(t1);
				return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize +
					"H" + w0 * cellSize + "V" + 7 * cellSize +
					"H" + w1 * cellSize + "V" + (d1 + 1) * cellSize +
					"H" + (w1 + 1) * cellSize + "V" + 0 +
					"H" + (w0 + 1) * cellSize + "Z";
			}
		}
	});
});
