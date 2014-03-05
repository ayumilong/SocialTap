/*global d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/request/xhr',
		'./Base',
		'../util/staticjs!static/d3.js'
], function(declare, lang, domGeom, xhr, BaseVis) {
	return declare([BaseVis], {

		nodes: null,
		node: null,
		tree: null,
		facet: 'hashtag',	// Default facet set to hashtags
		numChildren: 5,		// Default number of children is 5
		facetMap: {
			"hashtag" : "twitter_entities.hashtags.text",				// Hashtags Facet
			"author" : "twitter_entities.user_mentions.screen_name",	// Mentions Facet
			"body" : "body"												// Anything in body Facet
		},

		buildElasticsearchQuery: function(baseQuery) {
			// Adds the currently selected Facet to the query
			var query = lang.mixin(baseQuery,	{"facets" : {
													"words" : {
														"terms": {
															"field" : this.facetMap[this.facet]
														}
													}	
												}});
			console.log(JSON.stringify(query));
			return query;
		},
		constructor: function() {
			this.options = [
				// Gives you the option to change the field that will be queried upon clicking
				{
					name: 'facet',
					label: 'Facet',
					allowedValues: [
						{ label: 'Hashtag', value: 'hashtag' },
						{ label: 'Author', value: 'author' },
						{ label: 'Body', value: 'body' }
					]
				},
				// Gives you the option to change how many children will be added upon clicking
				{
					name: 'numChildren',
					label: 'Children',
					allowedValues: [
						{ label: '1', value: 1 },
						{ label: '2', value: 2 },
						{ label: '3', value: 3 },
						{ label: '4', value: 4 },
						{ label: '5', value: 5 },
						{ label: '6', value: 6 },
						{ label: '7', value: 7 },
						{ label: '8', value: 8 },
						{ label: '9', value: 9 },
						{ label: '10', value: 10 }
					]
				}
			];
		},


		draw: function(data) {
			// Sets up the initial SVG and D3 image
			data = this.mapData(data, 1);
			var m = [20, 120, 20, 120],	// Margins of SVG
				w = 1280 - m[1] - m[3], // Width and Height of SVG. Could be set to use
				h = 800 - m[0] - m[2];  //   with and height of div instead of being hardcoded.
			this.i = 0;

			this.tree = d3.layout.tree()
					.size([h, w]);

			this.diagonal = d3.svg.diagonal()
					.projection(function(d) { return [d.y, d.x]; });

			this.vis = d3.select(this.domNode).append("svg:svg")
				.attr("width", w + m[1] + m[3])
				.attr("height", h + m[0] + m[2])
				.append("svg:g")
				.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

			var that = this;

			that.root = data;
			that.root.x0 = h / 2;
			that.root.y0 = 0;

			// Initially sets all nodes to be closed
			function toggleAll(d) {
				if (d.children) {
					d.children.forEach(toggleAll);
					lang.hitch(that, that.toggle(d));
				}
			}
			lang.hitch(that, that.update(that.root));
		},
		update: function(source) {
			var that = this;
			var duration = d3.event && d3.event.altKey ? 5000 : 500;

			
			var nodes = this.tree.nodes(this.root).reverse();

			
			nodes.forEach(function(d) { d.y = d.depth * 180; });

			
			var node = this.vis.selectAll("g.node")
				.data(nodes, function(d) { return d.id || (d.id = ++that.i); });


			var nodeEnter = node.enter().append("svg:g")
				.attr("class", "node")
				.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
				.on("click", function(d) { lang.hitch(that, that.toggle(d));/* lang.hitch(this, that.update(d));*/ });

			nodeEnter.append("svg:circle")
				.attr("r", 1e-6)
				.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

			nodeEnter.append("svg:text")
				.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
				.attr("dy", ".35em")
				.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
				.text(function(d) { return d.name; })
				.style("fill-opacity", 1e-6);

			var nodeUpdate = node.transition()
				.duration(duration)
				.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

			nodeUpdate.select("circle")
				.attr("r", 4.5)
				.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

			nodeUpdate.select("text")
				.style("fill-opacity", 1);

			var nodeExit = node.exit().transition()
				.duration(duration)
				.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
				.remove();

			nodeExit.select("circle")
				.attr("r", 1e-6);

			nodeExit.select("text")
				.style("fill-opacity", 1e-6);

			var link = this.vis.selectAll("path.link")
				.data(this.tree.links(nodes), function(d) { return d.target.id; });

			link.enter().insert("svg:path", "g")
				.attr("class", "link")
				.attr("d", function(d) {
					var o = {x: d.source.x0, y: d.source.y0};
					var diag = that.diagonal({source: o, target: o});
					return diag;
				})
			.transition()
				.duration(duration)
				.attr("d", that.diagonal);

			link.transition()
				.duration(duration)
				.attr("d", that.diagonal);

			link.exit().transition()
				.duration(duration)
				.attr("d", function(d) {
					var o = {x: source.x, y: source.y};
					return that.diagonal({source: o, target: o});
				})
				.remove();

			nodes.forEach(function(d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		},

		// Toggles a single node.		
		toggle: function(d) {
			if (d.children) {
				// If it already has children they will be retracted of expanded,
				//	 and vice versa.
				d._children = d.children;
				d.children = null;
				lang.hitch(this, this.update(d));
			} else {
				// If it hasn't gotten its children yet, they will be queried for.
				lang.hitch(this, this.queryNewData(d));
			}			
		},

		// Queries new data based on the name of the node clicked and facet
		queryNewData: function(node) {
			var query = {
				"query" : {
					"filtered" : {
			            "query" : {
			                "match_all" : {}
			            },
			            "filter" : {
			               "term" : {
			                    "body" : node.name  // Text from clicked node
			                }
			            }
			        }
			    },
			    "facets" : {
					"words" : {
						"terms" : {
							"field" : this.facetMap[this.facet]  // Selected facet
						}
					}
				}
			};
			xhr.post('/api/v0/datasets/' + this.datasetId + '/search', {
				data: JSON.stringify({elasticsearch: query}),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response
			.then(lang.hitch(this, function(response) { this.addData(response, node); }));
		},

		addData: function(data, node) {
			var newNodes = this.mapData(data.data, this.numChildren + 1);	// Adds 1 because parent name will
			var i = 0;														//   taken out.
			node.children = node._children;
			node._children = null;
			if (!node.children) {
				node.children = [];
				for(i = 0; i < newNodes.length; i = i + 1) {
					// Ensures parent node won't be added as a child of itself
					if (node.name != newNodes[i].name) {
						// Pushes new nodes onto clicked node's children array
						node.children.push(newNodes[i]);
					}
				}
			}
			lang.hitch(this, this.update(node));
		},

		// Maps the data from the returned Elasticsearch object to the
		//  structure used by the tree. 
		mapData: function(data, amount) {
			var nodes;
			var i = 0;
			data = data.facets.words.terms;	
			if (amount == 1) {
				nodes = {"name" : data[0].term};
			} else {
				nodes = [];
				while (i < amount && i < data.length) {
					nodes.push({"name" : data[i].term});	
					i = i + 1;
				}
			}
			return nodes;
		}
	});
});
