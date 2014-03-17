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

		getMostRetweetedUsers: function(baseQuery) {
			return this.queryDataset(lang.mixin(baseQuery, {
				aggs: {
					retweets: {
						filter: { term: { verb: "share" } },
						aggs: {
							retweeted_user: {
								terms: {
									field: "object.actor.preferredUsername",
									size: 50
								}
							}
						}
					}
				}
			})).then(lang.hitch(this, function(response) {
				return response.aggregations.retweets.retweeted_user.buckets.map(function(b) { return { username: b.key, times_retweeted: b.doc_count }; });
			}));
		},

		getRetweetMatrix: function(baseQuery, users) {
			var query = baseQuery;
			query.aggs = {
				retweets: {
					filter: { term: { verb: "share" } },
					aggs: {}
				}
			};

			users.forEach(function(u1) {
				var queryPart = {
					filter: { term: { "object.actor.preferredUsername": u1 } },
					aggs: {}
				};

				users.forEach(function (u2) {
					queryPart.aggs[u2] = {
						filter: { term: { "actor.preferredUsername": u2 } }
					};
				});

				query.aggs.retweets.aggs[u1] = queryPart;
			});

			return this.queryDataset(query).then(function(response) {
				console.log(response);
				var matrix = [];
				users.forEach(function(u1, i) {
					matrix.push([]);
					users.forEach(function(u2) {
						matrix[i].push(response.aggregations.retweets[u1][u2].doc_count);
					});
				});

				return matrix;
			});
		},

		loadData: function(baseQuery) {
			return this.getMostRetweetedUsers(lang.clone(baseQuery)).then(lang.hitch(this, function(users) {
				return this.getRetweetMatrix(lang.clone(baseQuery), users.map(function(u) { return u.username; })).then(function(matrix) {
					// matrix[user1][user2] = number of times user2 retweeted user1
					return {
						users: users,
						retweets: matrix
					};
				});
			}));
		},

		draw: function(data) {
			console.log(data);

			var layout = d3.layout.chord()
				.padding(0.05)
				.sortSubgroups(d3.descending)
				.matrix(data.retweets);

			var box = domGeom.getContentBox(this.domNode);
			var height = box.h;
			var width = box.w;

			var innerRadius = Math.min(width, height) * 0.32;
			var outerRadius = innerRadius * 1.1;

			var svg = d3.select(this.domNode).append('svg')
				.attr('width', width)
				.attr('height', height)
				.append('g')
					.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

			var fill = d3.scale.category20();

			var fade = function(opacity) {
				return function(g, i) {
					svg.selectAll(".chord path")
						.filter(function(d) { return d.source.index != i && d.target.index != i; })
						.transition()
						.style("opacity", opacity);
				};
			};

			var groupPaths = svg.append("g").selectAll("path")
				.data(layout.groups).enter()
					.append("path")
						.style("fill", function(d) { return fill(d.index % 20); })
						.style("stroke", function(d) { return fill(d.index % 20); })
						.attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
						.on("mouseover", fade(0.1))
						.on("mouseout", fade(1));

			groupPaths.append('title').text(function(d) {
				return data.users[d.index].username + ' was retweeted ' + data.users[d.index].times_retweeted + ' times in total';
			});

			var chords = svg.append("g")
				.attr("class", "chord")
				.selectAll("path")
					.data(layout.chords).enter()
						.append("path")
							.attr("d", d3.svg.chord().radius(innerRadius))
							.style("fill", function(d) { return fill(d.source.index % 20); })
							.style("opacity", 1)
							.attr('title', 'hello');

			chords.append('title').text(function(d) {
				return data.users[d.source.index].username + ' retweeted ' + data.users[d.target.index].username + ' ' + d.target.value + ' times\n' +
					data.users[d.target.index].username + ' retweeted ' + data.users[d.source.index].username + ' ' + d.source.value + ' times';
			});

			var labelGroups = svg.append('g').selectAll('g')
				.data(layout.groups).enter()
					.append('g')
						.attr('transform', function(d) {
							return 'rotate(' + ((d.startAngle + d.endAngle) / 2 * 180 / Math.PI - 90) + ')' +
								'translate(' + outerRadius + ',0)';
						});

			labelGroups.append('text')
				.text(function(d) { return data.users[d.index].username; })
				.attr('x', 8)
				.attr('dy', '0.35em')
				.attr('transform', function(d) {
					var angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI;
					return angle > 180 ? 'rotate(180)translate(-16)' : null;
				})
				.style('font-size', '10pt')
				.style('text-anchor', function(d) {
					var angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI;
					return angle > 180 ? 'end' : null;
				});

			svg.append('text')
				.text('Retweets between most retweeted users')
				.attr('transform', 'translate(-' + (width/2) + ',-' + (height/2) + ')')
				.attr('dx', '0.2em')
				.attr('dy', '1.2em');
		}

	});
});
