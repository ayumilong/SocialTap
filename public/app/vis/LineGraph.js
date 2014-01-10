/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'./Base',
		'../util/staticjs!static/d3.js',
		'../util/staticjs!static/d3.layout.cloud.js'
], function(declare, lang, domGeom, BaseVis) {
	return declare([BaseVis], {


		xaxis: "month",
		parseDate: null,

		buildElasticsearchQuery: function(baseQuery) {
			return lang.mixin(baseQuery, { "size" : 1000 });
		},

		constructor: function() {
			this.options = [
				{
					name: 'xaxis',
					label: 'Range',
					values: [
						{ label: 'Day', value: 'day' },
						{ label: 'Week', value: 'week' },
						{ label: 'Month', value: 'month' },
						{ label: 'Year', value: 'year' },
						{ label: 'All', value: 'all' }
					]
				}
			];
		},

		draw: function(data) {
			console.log(data);
			var sample = data.hits.hits;
			var i = 0, map = {}, date, key, xDomain;

			//var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

			var margin = {top: 20, right: 20, bottom: 20, left: 40};

			var width = parseInt(d3.select(this.domNode).style("width").split("px")[0], 10) - margin.left - margin.right;
			var height = parseInt(d3.select(this.domNode).style("height").split("px")[0], 10) - margin.top - margin.bottom - 100;

			console.log("width: " + width);


			var x = d3.time.scale()
			    .range([0, width]);
			var y = d3.scale.linear()
				.range([height, 0]);

			var xAxis = d3.svg.axis()
			    .scale(x)
			    .orient("bottom");
			var yAxis = d3.svg.axis()
				.scale(y)
			    .orient("left");

			var line = d3.svg.line()
				.x(function(d) { return x(d.date); })
				.y(function(d) { return y(d.amount); });

			switch (this.xaxis) {
				case "day":
					this.parseDate = d3.time.format("%H").parse;
					break;
				case "week":
					this.parseDate = d3.time.format("%w").parse;
					break;
				case "month":
					this.parseDate = d3.time.format("%d").parse;
					break;
				case "year":
					this.parseDate = d3.time.format("%d-%m").parse;
					break;
				case "all":
					this.parseDate = d3.time.format("%d-%b-%m").parse;
					break;
			}

			while (i < sample.length) {
				date = new Date(sample[i]._source.postedTime);
				i+=1;
				switch (this.xaxis) {
					case "day":
						key = date.getHours();
						break;
					case "week":
						key = date.getDay();
						break;
					case "month":
						key = date.getDate();
						break;
					case "year":
						key = date.getDate() + "-" + date.getMonth();
						break;
					case "all":
						key = date.getDate() + "-" + date.getDate() + "-" + date.getMonth();
						break;
				}
				console.log(key);
				if (map[key] == null) {
					map[key] = {};
					map[key].date = this.parseDate(key.toString());
					map[key].amount = 0;
				}
				map[key].amount += 1;
			}

			switch (this.xaxis) {
				case "day":
					this.parseDate = d3.time.format("%H").parse;
					xDomain = [this.parseDate("0"), this.parseDate("23")];
					break;
				case "week":
					this.parseDate = d3.time.format("%w").parse;
					xDomain = [this.parseDate("0"), this.parseDate("6")];
					break;
				case "month":
					this.parseDate = d3.time.format("%d").parse;
					xDomain = [this.parseDate("0"), this.parseDate("30")];
					break;
				case "year":
					this.parseDate = d3.time.format("%d-%m").parse;
					xDomain = [this.parseDate("1-1"), this.parseDate("31-12")];
					break;
				case "all":
					this.parseDate = d3.time.format("%d-%b-%m").parse;
					xDomain = d3.extent(data, function(d) { return d.date; });
					break;
			}

			data = d3.values(map);
			console.log(data);

			var svg = d3.select(this.domNode).append("svg")
			    .attr("width", width)
			    .attr("height", height + 100)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			x.domain(xDomain);
			y.domain(d3.extent(data, function(d) { return d.amount; }));

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Amount");

			svg.append("path")
				.datum(data)
				.attr("class", "line")
				.attr("d", line)
				.style("fill", "none")
				.style("stroke", "steelblue")
				.style("stroke-width", "1.5px");

		}


	});
});
