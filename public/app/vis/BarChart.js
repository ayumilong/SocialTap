/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'./Base'
], function(declare, lang, domGeom, BaseVis) {

	var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	var monthsOfYear = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"];

	return declare([BaseVis], {

		xaxis: 'timeofday',

		interval: {
			timeofday: 'hour',
			dayofweek: 'day',
			dayofmonth: 'day',
			month: 'month'
		},

		xDomain: {
			timeofday: [0, 24],
			dayofweek: [0, 7],
			dayofmonth: [1, 32],
			month: [0, 12]
		},

		dateParser: {
			timeofday: Date.prototype.getUTCHours,
			dayofweek: Date.prototype.getUTCDay,
			dayofmonth: Date.prototype.getUTCDate,
			month: Date.prototype.getUTCMonth
		},

		tickFormat: {
			timeofday: function(d) { return d + ":00"; },
			dayofweek: function(d) { return daysOfWeek[d]; },
			dayofmonth: function(d) { return d; },
			month: function(d) { return monthsOfYear[d]; }
		},

		options: [
			{
				name: 'xaxis',
				label: 'Range',
				allowedValues: [
					{ label: 'Time of Day', value: 'timeofday' },
					{ label: 'Day of Week', value: 'dayofweek' },
					{ label: 'Day of Month', value: 'dayofmonth' },
					{ label: 'Month', value: 'month' }
				]
			}
		],

		loadData: function(baseQuery) {
			return this.queryDataset(lang.mixin(baseQuery, {
				facets : {
					times : {
						date_histogram : {
							field : 'postedTime',
							interval : this.interval[this.xaxis]
						}
					}
				}
			})).then(lang.hitch(this, function(raw) {

				var dateParser = this.dateParser[this.xaxis];

				var counts = {};
				raw.facets.times.entries.forEach(function(e) {
					var x = dateParser.call(new Date(e.time));
					if (counts[x] === undefined) {
						counts[x] = 0;
					}
					counts[x] += e.count;
				});

				var domain = d3.range.apply(null, this.xDomain[this.xaxis]);
				return domain.map(function(d) {
					return {
						x: d,
						count: counts[d] || 0
					};
				});
			}));
		},

		draw: function(data) {

			// Calculate svg dimensions
			var box = domGeom.getContentBox(this.domNode);
			var margin = { top: 20, right: 60, bottom: 80, left: 90 };

			var width = box.w - margin.left - margin.right;
			var height = box.h - margin.top - margin.bottom;

			// Scales and axes
			var x = d3.scale.ordinal()
				.domain(d3.range.apply(null, this.xDomain[this.xaxis]))
				.rangeRoundBands([0, width], 0.1);
			var y = d3.scale.linear()
				.domain([0, d3.max(data, function(d) { return d.count; })])
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickFormat(this.tickFormat[this.xaxis]);
			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			// Main svg group
			var svg = d3.select(this.domNode).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			// Draw axes
			var xAxisGroup = svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.style("stroke-width", "2px")
				.call(xAxis);

			// Tilt labels except for day of month
			if (this.xaxis != "dayofmonth") {
				xAxisGroup.selectAll("text")
					.style("text-anchor", "end")
					.attr("transform", function() { return "translate(" + (-x.rangeBand() / 6) + ",1),rotate(-45)"; });
			}

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
					.attr("transform", "rotate(-90)")
					.attr("x", -height/2)
					.attr("y", -84)
					.attr("dy", ".71em")
					.style("text-anchor", "middle")
					.text("Tweets");

			// Draw bars
			svg.selectAll(".bar")
				.data(data).enter()
				.append("rect")
					.classed("bar", true)
					.attr("x", function(d) { return x(d.x); })
					.attr("width", x.rangeBand())
					.attr("y", function(d) { return y(d.count); })
					.attr("height", function(d) { return height - y(d.count); })
					.style("fill", "steelblue")
					.style("stroke-width", 1)
					.style("stroke", "#666");
		},

		_setXaxisAttr: function(xaxis) {
			this._set('xaxis', xaxis);
			this.reload();
		}

	});
});
