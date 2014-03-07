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
				tweetsByTerm: this.queryDataset(lang.mixin(baseQuery, {
					facets: {
						top_countries: {
							terms: {
								size: 100,
								field: "location.displayName"
							}
						}
					}
				})).then(function(data) {
					var tweetsByTerm = {};
					data.facets.top_countries.terms.forEach(function(t) {
						tweetsByTerm[t.term] = t.count;
					});
					return tweetsByTerm;
				})
			});
		},

		draw: function(data) {
			var svg = d3.select(this.domNode)
				.append('svg')
				.attr('width', '100%')
				.attr('height', '100%');

			this.drawCountries(svg, data.countryGeo);
			this.colorCountries(svg, data.tweetsByTerm);
		},

		drawCountries: function(svg, countries) {

			var box = domGeometry.getContentBox(this.domNode);
			var scale = box.w / 6.483;

			var projection = d3.geo.equirectangular()
				.scale(scale)
				.translate([3.18 * scale, scale * 1.55]);

			var path = d3.geo.path()
				.projection(projection);

			svg.selectAll('.country')
				.data(countries.features)
				.enter()
				.append('path')
				.attr('d', path)
				.attr('class', 'country')
				.attr('fill', '#ffffff')
				.attr('stroke', '#999999')
				.attr('stroke-width', 0.8);
		},

		colorCountries: function(svg, data) {
			var max = d3.max(d3.values(data));

			var color = function(count) {
				//var r = Math.floor((255 * count) / max);
				var g = Math.floor((255 * (max - count)) / max);
				//var b = 0;
				return (count > 0) ? "rgb(" + g + "," + g + "," + 255 + ")" : "#fff";
			};

			var viz = this;
			svg.selectAll(".country")
				.style("fill", function() {
					var country = d3.select(this).data()[0].properties;
					return color(data[country.abbr.toLowerCase()] || 0);
				})
				.on("mouseover", function(d) {
					var country = d.properties;
					viz.emit('display_info', country.name + ': ' + (data[country.abbr.toLowerCase()] || 0) + ' tweets');
					d3.select(this)
						.attr('stroke', '#000000')
						.attr('stroke-width', 1.8);
				})
				.on("mouseout", function() {
					d3.select(this)
						.attr('stroke', '#999999')
						.attr('stroke-width', 0.8);
				});
		}
	});
});
