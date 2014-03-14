/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/promise/all',
		'dojo/request/xhr',
		'dojo/dom-construct',
		'./Base',
		'../util/staticjs!static/d3.js',
		'../util/staticjs!static/line-variable.js'
], function(declare, lang, domGeometry, all, xhr, domConstruct, BaseVis) {
	return declare([BaseVis], {

		'class': 'timeMap',

		loadCountries: function() {
			return xhr.get('/app/vis/countries.json', { handleAs: 'json' });
		},

		loadDatasetTimeRange: function(baseQuery) {
			return this.queryDataset(lang.mixin(lang.clone(baseQuery), {
				facets: { time: { statistical: { field: 'postedTime' } } }
			})).then(function(data) {
				return {
					start: data.facets.time.min,
					end: data.facets.time.max
				};
			});
		},

		loadLocationsInTimeRange: function(baseQuery, startTime, endTime) {
			var format = d3.time.format.utc("%Y-%m-%d");

			return this.queryDataset(lang.mixin(lang.clone(baseQuery), {
				facets: {
					loc: {
						terms: {
							script: "(90 + floor(doc['socialtap.geo_location'].lat)) + ',' + (180 + floor(doc['socialtap.geo_location'].lon))",
							size: 64800
						},
						facet_filter: {
							and: [
								{ exists: { field: "socialtap.geo_location" } },
								{ range: { postedTime: { lte: format(new Date(endTime)), gte: format(new Date(startTime)) } } }
							]
						}
					}
				}
			})).then(function(data) {

				// Create 180x360 array to hold number of tweets at each lat/lon coordinate.
				var tweetsByCoordinate = d3.range(0, 180).map(function() {
					return d3.range(0, 360).map(function() { return 0; });
				});

				data.facets.loc.terms.forEach(function(e) {
					var parts = e.term.split(',');
					var lat = parseInt(parts[0]);
					var lon = parseInt(parts[1]);
					tweetsByCoordinate[lat][lon] = e.count;
				});

				return {
					start: startTime,
					end: endTime,
					tweets: tweetsByCoordinate.reverse()
				};
			});
		},

		loadData: function(baseQuery) {
			return all({
				countries: this.loadCountries(),
				times: this.loadDatasetTimeRange(baseQuery).then(lang.hitch(this, function(timeRange) {
					var interval = 21600000; // 6 hours
					//var interval = 86400000; // 24 hours
					//var interval = 604800000;
					var start = timeRange.start - (timeRange.start % interval);
					var d = start;
					var promises = [];
					while (d < timeRange.end) {
						promises.push(this.loadLocationsInTimeRange(baseQuery, d, d + interval));
						d += interval;
					}
					return all(promises);
				}))
			});
		},

		draw: function(data) {
			var box = domGeometry.getContentBox(this.domNode);
			var width = box.w;
			var height = box.w * 0.6;

			var svg = d3.select(this.domNode)
				.append('svg')
				.attr('width', width)
				.attr('height', height);

			var x = d3.scale.linear()
				.domain([0, 360])
				.range([0, width]);

			var y = d3.scale.linear()
				.domain([0, 180])
				.range([0, height]);

			var tweetsGroup = svg.append('g')
				.attr('class', 'locations');

			var tweetCountToHeight = d3.scale.linear()
				.domain([0, 1, 1000])
				.range([0, -1, -180]);

			var area = d3.svg.area()
				.x(function(d, i) { return x(i); })
				.y(tweetCountToHeight)
				.y1(0);

			var line = d3.svg.line.variable()
				.x(function(d, i) { return x(i); })
				.y(tweetCountToHeight)
				.w(function(d) { return d > 0 ? 0.5 : 0; });

			var selectedInterval = 0;

			var lonGroups = tweetsGroup.selectAll('g')
				.data(data.times[selectedInterval].tweets).enter()
				.append('g')
					.attr('transform', function(d, i) { return 'translate(0,' + y(i) + ')'; });

			lonGroups.append('path')
				.classed('area', true)
				.attr('d', area)
				.attr('transform', function(d) { return 'translate(' + x(d.index) + ',0)'; })
				.style('fill', 'white');

			lonGroups.append('path')
				.classed('line', true)
				.attr('d', line)
				.attr('transform', function(d) { return 'translate(' + x(d.index) + ',0)'; })
				.style({fill: 'black', 'stroke-width': '.5px', stroke: 'black', 'stroke-opacity': 0.1});

			// Draw country borders
			var countriesPath = d3.geo.path()
				.projection(function(coordinate) { return [ x(coordinate[0]), y(-coordinate[1]) ]; });

			var countriesGroup = svg.append('g')
				.attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

			countriesGroup.selectAll('path')
				.data(data.countries.features).enter()
				.append('path')
					.attr('d', countriesPath)
					.style({ 'fill-opacity': 0, 'stroke': '#ddd', 'stroke-width': '0.8px', 'stroke-opacity': 0.8 });

			// Draw time scale
			var timeScale = d3.time.scale()
				.domain([ d3.min(data.times, function(d) { return new Date(d.start); }), d3.max(data.times, function(d) { return new Date(d.end); }) ])
				.range([0, width - 40]);

			var timeAxis = d3.svg.axis().scale(timeScale).orient('bottom');

			var timeGroup = svg.append('g')
				.attr('transform', 'translate(20,' + (height - 50) + ')');

			timeGroup.append('g')
				.classed('axis', true)
				.call(timeAxis);

			var dateFormat = d3.time.format.utc("%Y-%m-%d %H:%M:%S UTC");

			var intervalDateRange = function(interval) {
				return dateFormat(new Date(data.times[interval].start)) + ' - ' + dateFormat(new Date(data.times[interval].end));
			};

			var intervalText = timeGroup.append('text')
				.style('font-size', '13px')
				.attr('y', -25)
				.text(intervalDateRange(selectedInterval));

			var intervalsGroup = timeGroup.append('g')
				.classed('intervals', true);

			var selectedIntervalIndicator = intervalsGroup.append('rect')
				.attr('x', timeScale(new Date(data.times[selectedInterval].start)))
				.attr('y', -21)
				.attr('width', timeScale(new Date(data.times[selectedInterval].end)) - timeScale(new Date(data.times[selectedInterval].start)))
				.attr('height', 20)
				.style('fill', '#060')
				.style('fill-opacity', 0.6);

			var refreshProgressIndicator = tweetsGroup.append('line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x1', x(360))
				.attr('y2', 0)
				.style('stroke-width', 3)
				.style('stroke-opacity', 0);

			var transitionToInterval = function(index) {
				//different color/direction when moving forward and backword in time
				var movingUp = index > selectedInterval;
				selectedInterval = index;

				selectedIntervalIndicator.transition()
					.duration(600)
					.ease(d3.ease('elastic', 1, 0.45))
					.attr('x', timeScale(new Date(data.times[selectedInterval].start)))
					.attr('width', timeScale(new Date(data.times[selectedInterval].end)) - timeScale(new Date(data.times[selectedInterval].start)));

				refreshProgressIndicator
					.attr('y1', movingUp ? y(0) : y(180))
					.attr('y2', movingUp ? y(0) : y(180))
					.style('stroke', movingUp ? '#060' : 'steelblue')
					.style('stroke-opacity', 0.2);

				refreshProgressIndicator.transition().delay(750).duration(4200).ease(d3.ease('linear'))
					.attr('y1', movingUp ? y(180) : y(0))
					.attr('y2', movingUp ? y(180) : y(0))
					.each('end', function() { d3.select(this).style('stroke-opacity', 0); });

				lonGroups.data(data.times[index].tweets).each(function(longData, longitudeNum) {
					var delay = 20 * (movingUp ? longitudeNum : 180 - longitudeNum) + 750;
					d3.select(this).select('.area')
						.datum(longData)
						.transition().duration(600).delay(delay)
						.attr('d', area);

					d3.select(this).select('.line')
						.datum(longData)
						.transition().duration(600).delay(delay)
						.attr('d', line)
						.each('start', function() {
							d3.select(this).style('fill', movingUp ? '#006600' : 'steelblue');
						})
						.style('fill', 'black');
				});

			};

			intervalsGroup.selectAll('rect.interval')
				.data(data.times).enter()
					.append('rect')
						.classed('interval', true)
						.attr('x', function(d) { return timeScale(new Date(d.start)); })
						.attr('y', -21)
						.attr('width', function(d) { return timeScale(new Date(d.end)) - timeScale(new Date(d.start)); })
						.attr('height', 20)
						.style('fill', '#060')
						.style('fill-opacity', 0.2)
						.on('mouseover', function(d, i) {
							d3.select(this).style('fill-opacity', 0.6);
							intervalText.text(intervalDateRange(i));
						})
						.on('mouseout', function() {
							d3.select(this).style('fill-opacity', 0.2);
							intervalText.text(intervalDateRange(selectedInterval));
						})
						.on('click', function(d, i) {
							intervalText.text(intervalDateRange(selectedInterval));
							transitionToInterval(i);
						});


		}
	});
});
