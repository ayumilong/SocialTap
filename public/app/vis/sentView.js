/*global $,d3*/
define(['dojo/_base/declare',
		'dojo/dom-construct',
		'app/vis/VisBaseView.js',
		'app/vis/jsPlugin!static/d3.js',
		'app/vis/jsPlugin!static/jquery.js'
], function(declare, domConstruct, VisBaseView) {
	return declare([VisBaseView], {

		'class': 'SentView',
		parentView: '/',
		route: '/sentiment/:dataset',
		title: 'Sentiment Graph',
		map: [],
		max: 0,
		activated: false,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('div', {
				'id': "graph"
			}, this.domNode);
		},
		activate: function(e) {
			this.dataset = e.params.dataset;
			if (!this.activated) {
				this.query();
				this.activated = true;
			}
		},

		query: function() {
			var that = this;
			var query = {
				"elasticsearch" : {
					"size" : "10000",
					"query": {
						"match" : {"body": "chicken"}
					},
					"sort":[ { "postedTime" : {"order" : "asc" } } ]
				}
			};
			this.es(query, this.buildMap);

		},

		resize: function() {
			if (this.activated) {
				d3.select("svg").remove();
				this.draw();
			}
		},
		buildMap: function(data) {
			var sample = data.hits.hits;
			var i = 0, date, year, month, last = 0, monthCounter = -1;
			var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;
			while (i < sample.length) {
				date = sample[i]._source.postedTime;
				month = date.split("-");
				year = month[0];
				month = month[2].split("T")[0];
				if (!(last == month + " " + year)) {
					monthCounter += 1;
					last = month + " " + year;
					this.map[monthCounter] = { "neg" : 0, "neu" : 0, "pos" : 0, "total" : 0, "date" : parseDate(date)};
				}
				if (sample[i]._source.sentiment == "-1") {
					this.map[monthCounter].neg += 1;
				}
				else if (sample[i]._source.sentiment == "0") {
					this.map[monthCounter].neu += 1;
				}
				else if (sample[i]._source.sentiment == "1") {
					this.map[monthCounter].pos += 1;
				}
				else {
					console.log("Soemthing went wrong. Sentiment was " + sample[i]._source.sentiment);
					this.map[monthCounter].pos += 1;
				}
				this.map[monthCounter].total += 1;
				if (this.map[monthCounter].total > this.max) {
					this.max = this.map[monthCounter].total;
				}
				i = i + 1;
			}
			this.draw();
		},
		draw: function() {
			var data = this.map;
			var thisMax = this.max;
			var margin = {top: 20, right: 35, bottom: 35, left: 35};
			/*var tempWidth = d3.select("#dojox_mobile_Pane_1").style("width");
			var tempHeight = d3.select("#dojox_mobile_Pane_5").style("height");
			tempWidth = tempWidth.split("px")[0];
			tempHeight = tempHeight.split("px")[0];*/
			var tempWidth = 800;
			var tempHeight = 600;
			var width = tempWidth - margin.left - margin.right;
			var height = 0;
			var fontsize;
			if (width/1.5 > tempHeight) {
				height = tempHeight - margin.top - margin.bottom;
			}
			else {
				height = (width/1.5) - margin.top - margin.bottom;
				console.log('this should happen');
			}
			fontsize = width/50;
			if (fontsize > 15) {
				fontsize = 15;
			}
			var x = d3.time.scale()
				.range([0, width]);

			var y = d3.scale.linear()
				.range([height, 0])
				.domain([0, thisMax]);

			var color = d3.scale.category20();

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickSize(2)
				.tickFormat(d3.time.format("%b %y"));

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickSize(2);

			var area = d3.svg.area()
				.x(function(d) { return x(d.date); })
				.y0(function(d) { return y(d.y0); })
				.y1(function(d) { return y(d.y0 + d.y); });


			var stack = d3.layout.stack()
				.values(function(d) { return d.values; });

			var svg = d3.select("#graph").append("svg")
				.attr("width", width + margin.left + margin.right - 10)
				.attr("height", height + margin.top + margin.bottom - 10)
			    .append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


			  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date" && key !== "total"; }));

			  var sentiments = stack(color.domain().map(function(name) {
				return {
				  name: name,
				  values: data.map(function(d) {
					return {date: d.date, y: d[name]};
				  })
				};
			  }));

			  x.domain(d3.extent(data, function(d) { return d.date; }));

			  var sentiment = svg.selectAll(".sentiment")
				  .data(sentiments)
				.enter().append("g")
				  .attr("class", "sentiment");

			  sentiment.append("path")
				  .attr("class", "area")
				  .attr("d", function(d) { console.log(d);return area(d.values); })
				  .style("fill", function(d) { return color(d.name); });

			  sentiment.append("text")
				  .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
				  .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y / 2) + ")"; })
				  .attr("x", -6)
				  .attr("dy", ".35em")
				  .style("font-size",fontsize)
				  .text(function(d) { return d.name; });

			  svg.append("g")
				  .attr("class", "x axis")
				  .style("font-size",fontsize)
				  .attr("transform", "translate(0," + height + ")")
				  .call(xAxis);

			  svg.append("g")
				  .style("font-size",fontsize)
				  .attr("class", "y axis")
				  .call(yAxis);
		}

	});
});
