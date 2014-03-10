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
			return all({
				// Country data from https://gist.github.com/2969317
				countryGeo: xhr.get('/app/vis/countries.json', { handleAs: 'json' }),
				tweetsByCoordinate: this.queryDataset(lang.mixin(baseQuery, {
					facets: {
						loc: {
							terms: {
								script: "round(doc['socialtap.geo_location'].lat) + ',' + round(doc['socialtap.geo_location'].lon)",
								size: 64800
							},
							facet_filter: {
								exists: {
									field: "socialtap.geo_location"
								}
							}
						}
					}
				})).then(function(data) {
					return data.facets.loc.terms.map(function(e) {

						var parts = e.term.split(',');

						var d = {
							lat: parseFloat(parts[0]),
							lon: parseFloat(parts[1]),
							count: e.count
						};

						return d;
					});
				})
			});
		},

		draw: function(data) {

			var svg = d3.select(this.domNode)
				.append('svg')
				.attr('width', '100%')
				.attr('height', '100%');

			var box = domGeometry.getContentBox(this.domNode);
			var scale = box.w / 6.483;

			var projection = d3.geo.equirectangular()
				.scale(scale)
				.translate([3.18 * scale, scale * 1.55]);

			var path = d3.geo.path()
				.projection(projection);

			svg.selectAll('.country')
				.data(data.countryGeo.features)
				.enter()
				.append('path')
					.attr('d', path)
					.attr('class', 'country')
					.attr('fill', '#ffffff')
					.attr('stroke', '#999999')
					.attr('stroke-width', 0.8);

			var interpolate = d3.interpolateHsl(d3.hsl(130, 1.0, 0.6), d3.hsl(130, 1.0, 0.2));
			var maxCount = d3.max(data.tweetsByCoordinate, function(d) { return d.count; });
			var color = function(count) {
				return interpolate(count / maxCount);
			};

			svg.selectAll('.coordinate')
				.data(data.tweetsByCoordinate)
			.enter().append('rect')
				.attr('x', function(d) { return projection([d.lon, d.lat])[0]; })
				.attr('y', function(d) { return projection([d.lon, d.lat])[1]; })
				.attr('width', function(d) { return Math.abs(projection([d.lon + 1, d.lat])[0] - projection([d.lon, d.lat])[0]); })
				.attr('height', function(d) { return Math.abs(projection([d.lon, d.lat + 1])[1] - projection([d.lon, d.lat])[1]); })
				.style('fill', function(d) { return color(d.count); })
				.on("mouseover", lang.hitch(this, function(d) {
					this.emit('display_info', 'Lon/Lat: ' + d.lon + '.0, ' + d.lat + '.0<br>' + d.count + ' tweets');
				}));
		}
	});
});
