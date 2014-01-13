/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'./Base',
		'../util/staticjs!static/d3.js',
		'../util/staticjs!static/d3.layout.cloud.js'
], function(declare, lang, domGeom, BaseVis) {
	return declare([BaseVis], {

		xaxis: "year",
		axisMap: {	"day" : "1h", 
					"week" : "day", 
					"month" : "day", 
					"year" : "day", 
					"all" : "day" },
		parseDate: null,

		buildElasticsearchQuery: function(baseQuery) {
			return lang.mixin(baseQuery,{"facets" : {
												"histo1" : {
													"date_histogram" : {
														"field" : "postedTime",
														"interval" : this.axisMap[this.xaxis]
													}
												}
											} 
										});
		},

		draw: function(data) {
			console.log(data);
			var sample = data.facets.histo1.entries;
			var i = 0, map = {}, date, key, xDomain;

			//var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

			var margin = {top: 20, right: 60, bottom: 20, left: 60};

			var width = parseInt(d3.select(this.domNode).style("width").split("px")[0], 10) - margin.left - margin.right;
			var height = parseInt(d3.select(this.domNode).style("height").split("px")[0], 10) - margin.top - margin.bottom - 30;

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
					this.parseDate = d3.time.format("%d-%m-%Y").parse;
					break;
				case "month":
					this.parseDate = d3.time.format("%d").parse;
					break;
				case "year":
					this.parseDate = d3.time.format("%d-%m").parse;
					break;
				case "all":
					this.parseDate = d3.time.format("%d-%m-%Y").parse;
					break;
			}

			while (i < sample.length) {
				date = new Date(sample[i].time);
				switch (this.xaxis) {
					case "day":
						key = date.getHours();
						break;
					case "week":
						key = date.getDay() + 1;
						key = key + "-1-12";
						console.log(key);
						break;
					case "month":
						key = date.getDate();						
						break;
					case "year":
						key = date.getMonth() + 1;
						key = date.getDate() + "-" + key;
						break;
					case "all":
						key = date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
						break;
				}
				console.log(sample[i]);
				if (map[key] == null) {
					map[key] = {};
					map[key].date = this.parseDate(key.toString());
					map[key].amount = 0;
				}
				map[key].amount += sample[i].count;
				i+=1;
			}

			data = d3.values(map);
			switch (this.xaxis) {
				case "day":
					xAxis.tickFormat(d3.time.format("%I:%M%p"));
					xAxis.ticks(12);
					this.parseDate = d3.time.format("%H").parse;
					xDomain = [this.parseDate("0"), this.parseDate("23")];
					break;
				case "week":
					xAxis.tickFormat(d3.time.format("%A"));
					xAxis.ticks(7);
					this.parseDate = d3.time.format("%d-%m-%Y").parse;
					xDomain = [this.parseDate("1-1-12"), this.parseDate("7-1-12")];
					break;
				case "month":
					xAxis.tickFormat(d3.time.format("%e"));
					this.parseDate = d3.time.format("%d").parse;
					xDomain = [this.parseDate("1"), this.parseDate("31")];
					break;
				case "year":
					xAxis.tickFormat(d3.time.format("%B"));
					this.parseDate = d3.time.format("%d-%m").parse;
					xDomain = [this.parseDate("1-1"), this.parseDate("31-12")];
					break;
				case "all":
					this.parseDate = d3.time.format("%d-%m-%Y").parse;
					xDomain = d3.extent(data, function(d) { return d.date; });
					break;
			}
			console.log(xDomain);
			data.sort(function(a,b) {return a.date - b.date;});
			console.log(data);

			var svg = d3.select(this.domNode).append("svg")
			    .attr("width", width + 100)
			    .attr("height", height + 100)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			x.domain(xDomain);
			y.domain(d3.extent(data, function(d) { return d.amount; }));

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.style("stroke-width", "2px")
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
