/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/request/xhr',
		'./Base'
], function(declare, lang, domGeom, xhr, BaseVis) {
	return declare([BaseVis], {

		buildElasticsearchQuery: function(query) {
			query.facets = {
				hashtags: {
					terms: {
						field: "twitter_entities.hashtags.text",
						size: 5
					}
				}
			};
			return query;
		},

		draw: function(data) {
			var hashtags = data.facets.hashtags.terms.map(function(t) { return t.term; });

			var query = lang.clone(this.baseQuery);
			query.facets = {};
			query.size = 0;
			hashtags.forEach(function(ht) {
				query.facets.times = {
					date_histogram: {
						field: 'postedTime',
						interval: '1h'
					}
				};
				query.facets['#' + ht] = {
					date_histogram: {
						field: 'postedTime',
						interval: '1h'
					},
					facet_filter: {
						term: {
							'twitter_entities.hashtags.text': ht
						}
					}
				};
			});

			xhr.post('/api/v0/datasets/' + this.get('datasetId') + '/search', {
				data: JSON.stringify({ elasticsearch: query }),
				handleAs: 'json',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).response.then(
			lang.hitch(this, function(response) {

				var buckets = response.data.facets.times.entries.map(function(e) {
					return {
						date: new Date(e.time),
						count: e.count
					};
				});
				var data = hashtags.map(function(ht) {
					return {
						tag: ht,
						values: response.data.facets.times.entries.map(function(t) {
							var entry = response.data.facets['#' + ht].entries.filter(function(e) { return e.time == t.time; })[0];
							return { date: new Date(t.time), count: (entry && entry.count) || 0 };
						})
					};
				});

				var contentBox = domGeom.getContentBox(this.domNode);

				var x = d3.time.scale().domain(d3.extent(buckets.map(function(b) { return b.date; }))).range([0, contentBox.w - 200]);
				var maxCount = d3.max(data.map(function(d) {
					return d3.max(d.values.map(function(v) { return v.count; }));
				}));
				var y = d3.scale.linear().domain([0, maxCount]).range([contentBox.h - 100, 0]);

				var xAxis = d3.svg.axis().scale(x).orient('bottom');
				var yAxis = d3.svg.axis().scale(y).orient('left');

				var svg = d3.select(this.domNode).append("svg")
					.attr("width", contentBox.w)
					.attr("height", contentBox.h);

				var container = svg.append('g').attr('transform', 'translate(60, 20)');

				container.append('g').call(xAxis).attr('transform', 'translate(0, ' + (contentBox.h - 100) + ')').style('fill', '#666');
				container.append('g').call(yAxis).style('fill', '#666')
					.append('text')
					.attr('transform', 'rotate(-90)')
					.attr('y', 8)
					.attr('dy', '0.71em')
					.style('text-anchor', 'end')
					.text('Tweets using hashtag');

				var line = d3.svg.line()
					.interpolate('basis')
					.x(function(d) { return x(d.date); })
					.y(function(d) { return y(d.count); });

				var tag = container.selectAll('.tag')
					.data(data)
					.enter()
					.append('g')
					.attr('class', 'tag');

				var color = d3.scale.category20();

				tag.append('path')
					.attr('class', 'line')
					.attr('d', function(d) { return line(d.values); })
					.style('stroke', function(d, i) { return color(i); })
					.style('fill', 'none');

				tag.append('text')
					.datum(function(d) { return { name: d.tag, value: d.values[d.values.length - 1] }; })
					.attr('transform', function(d) {
						return 'translate(' + x(d.value.date) + ',' + y(d.value.count) + ')';
					})
					.attr('dx', '5px')
					.attr('dy', '0.35em')
					.style('fill', function(d, i) { return color(i); })
					.text(function(d) { return '#' + d.name; });

				var marker = container.append('line')
					.attr('x1', 0)
					.attr('y1', 0)
					.attr('x2', 0)
					.attr('y2', d3.max(y.range()))
					.attr('stroke', '#666')
					.style('display', 'none');

				var bisectDate = d3.bisector(function(d) { return d.date; }).left;

				var rect = container.append('rect');
				rect.style('fill', 'none')
					.attr('width', '100%')
					.attr('height', '100%')
					.style('pointer-events', 'all')
					.on('mouseover', function() { marker.style('display', null); })
					.on('mouseout', function() { marker.style('display', 'none'); })
					.on('mousemove', lang.hitch(this, function() {
						var dm = x.invert(d3.mouse(rect[0][0])[0]);

						var i = bisectDate(buckets, dm, 1);
						var d0 = buckets[i - 1].date;
						var d1 = buckets[i] && buckets[i].date;

						var markerDate = d0;
						var markerIndex = i - 1;
						if (d1 !== undefined && (dm.getTime() - d0.getTime() > d1.getTime() - dm.getTime())) {
							markerDate = d1;
							markerIndex = i;
						}

						marker.attr('transform', 'translate(' + x(markerDate) + ',0)');

						var message = markerDate.toLocaleDateString() + ' ' + markerDate.toLocaleTimeString() + '<br>' +
							'Total: ' + buckets[markerIndex].count + '<br><br>';

						message += data.map(function(d, i) {
							return '<span style="color: ' + color(i) + ';">' +
								'#' + d.tag + ': ' +
								d.values[markerIndex].count +
								'</span>';
						}).join('<br>');

						this.emit('display_info', message);
					}));

			}),
			function(err) {
				console.error(err);
			});
		}

	});
});
