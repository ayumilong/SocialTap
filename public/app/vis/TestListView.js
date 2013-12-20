define(['dojo',
		'dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-style',
		'dojo/dom-construct',
		'dojo/topic',
		'dojo/on',
		'dojo/dom',
		'dojo/dom-geometry',
		'dojo/query',
		'dojo/request/xhr',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/ContentPane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/views/ModuleScrollableView',
		'dijit/registry',
		'app/vis/VisBaseView.js',
		'app/vis/DataAccordion',
		'app/vis/DataListItem.js',
		'app/vis/jsPlugin!static/jquery.js'
], function(dojo, declare, lang, domStyle, domConstruct, topic, on, dom, domGeom, query, xhr, EdgeToEdgeList, ContentPane, BaseListItem, ModuleScrollableView, registry, VisBaseView, DataAccordion, DataListItem, blank) {

	// module:
	//     app/vis/DataView

	return declare([VisBaseView], {
		// summary:
		//     View which displays a list of entries from a data search.

		route: '/test/:dataset',

		placesList: null,

		accordion: null,

		loading: false,

		activated: false,

		sortBy: "postedTime",

		order: "desc",

		count: 0,

		_singleton: {},

		postCreate: function() {
			this.inherited(arguments);

			//this.placesList = new EdgeToEdgeList();
			//this.placesList.placeAt(this.containerNode);
			//this.placesList.startup();
		},

		resize: function() {
			var children = this.accordion.getChildren();
			var i;
			for (i = 0; i < children.length; i += 1) {
				if (children[i].getPreviousSibling().selected) {
					//console.log(children[i]);
					domStyle.set(children[i].domNode, {"height": "100%"});
				}
			}
		},

		activate: function(e) {
			this.dataset = e.params.dataset;
			if (!this.activated) {
				this.inherited(arguments);
	
				topic.publish('/dojo-mama/updateSubNav', {
					back: '/vis'
				});
				this.accordion = new DataAccordion();
				this.accordion.startup();
				this.accordion.placeAt(this.domNode);
				this.activated = true;
				this.loading = true;
				this.getData(50);
				this.setupEvents();
			}
		},

		getData: function(amount, reset) {
			if (reset) {
				this.count = 0;
			}
			var that = this;
			var query = { 
				"elasticsearch" : {
					"size" : amount,
					"from" : this.count,
					"sort" : [{}],
					"query": {
						"match": {"body": "south"}
					}
				}
			};

			query.elasticsearch.sort[0][this.sortBy] = {"order" : this.order};
			query.elasticsearch.sort[0][this.sortBy].mode = "min";
		
			this.es(query, this.draw);	


		},
		draw: function(data, reset) {
			data = data.hits.hits;
			var i, li, pane, paneAttrs;
			if (reset) {
				this.count = 0;
				this.accordion.clear();
			}
			this.count += data.length;

			for (i = 0; i < data.length; i++) {
				pane = new DataListItem({
					data: data[i]._source,
					label: data[i]._source.actor.displayName
				});
				this.accordion.addChild(pane);
				paneAttrs = registry.byNode(pane.domNode);
			}
			this.loading = false;
		},

		sortEntries: function(sortId) {
			this.accordion.clear();
			var newSort;
			switch(sortId) {
				case "accordionColumnUsername":
					newSort = "actor.displayName";
				break;
				case "accordionColumnDate":
					newSort = "postedTime";
				break;
				case "accordionColumnBody":
					newSort = "body";
				break;
			}
			if (this.sortBy == newSort) {
				this.toggleOrder();
			}
			this.sortBy = newSort;
			this.getData(50, true);
		},

		createLabel: function() {
			var label = domConstruct.create('div', {
				'class' : 'mblAccordionTitleTextBox'
			});
			return label;

		},
		
		dataPoints: function() {
			var pos = domGeom.position(this.accordion.domNode, true);
			if (Math.abs(pos.y) > Math.abs(pos.h) - 1500) {
				this.getNextGroup();
			}
		},
		
		getNextGroup: function() {
			if (!this.loading) {
				this.loading = true;
				this.getData(5);
			}
		},

		setupEvents: function() {
			var that = this;
			on(this.domNode, "scroll", lang.hitch(this, this.dataPoints));
			on(this.domNode, "resize", this.resize);
			var buttons = query(".mblAccordionLabel");
			on(buttons, "click", function(e) {
				that.sortEntries(e.target.id);	
			});
		},

		toggleOrder: function() {
			if (this.order == "desc") {
				this.order = "asc";
			} else {
				this.order = "desc";
			}
		}
	});
});
