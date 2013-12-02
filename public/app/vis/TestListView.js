define(['dojo',
		'dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/topic',
		'dojo/on',
		'dojo/dom-geometry',
		'dojo/query',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/Accordion',
		'dojox/mobile/ContentPane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/views/ModuleScrollableView',
		'app/vis/DataListItem.js',
		'app/vis/jsPlugin!static/jquery.js'
], function(dojo, declare, lang, domAttr, topic, on, domGeom, query, EdgeToEdgeList, Accordion, ContentPane, BaseListItem, ModuleScrollableView, DataListItem, blank) {

	// module:
	//     app/vis/DataView

	return declare([ModuleScrollableView], {
		// summary:
		//     View which displays a list of entries from a data search.

		route: '/test',

		placesList: null,

		accordion: null,

		loading: false,

		activated: false,

		count: 0,

		postCreate: function() {
			this.inherited(arguments);

			this.placesList = new EdgeToEdgeList();
			this.placesList.placeAt(this.containerNode);
			this.placesList.startup();
			on(this.domNode, "scroll", lang.hitch(this, this.dataPoints));
			on(this.domNode, "resize", this.resize);
		},

		resize: function() {
			console.log("I get called");
			var children = this.accordion.getChildren();
			var i;
			for (i = 0; i < children.length; i += 1) {
				if (children[i].getPreviousSibling().selected) {
					console.log(children[i]);
					domAttr.set(children[i].domNode, "style", "height:100%;");
				}
			}
		},

		activate: function() {
			if (!this.activated) {
				this.inherited(arguments);
	
				topic.publish('/dojo-mama/updateSubNav', {
					back: '/vis'
				});
				this.accordion = new Accordion();
				this.accordion.startup();
				this.accordion.placeAt(this.domNode);
				this.activated = true;
				this.loading = true;
				this.getData(50);
			}
		},

		getData: function(amount) {
			/********************This code is only used for testing ***************/
			var that = this;
			console.log(this.count);
			var query = {
				"size" : amount,
				"from" : this.count,
				"query": {
					"match": {"body": "south"}
				}
			};


			$.ajax(
				{
					url: 'http://funkytron.clemson.edu:9200/south_tweets4/tweet/_search/',
					type: 'POST',
					crossDomain: true,
					dataType: 'json',
					data: JSON.stringify(query),
					success: function(data) {
						that.draw(data);
					},
					error: function(data) {
						console.error(data);
					}
				}
			);

		},
		
		draw: function(data) {
			data = data.hits.hits;
			this.count += data.length;
			console.log(data);	

			var i, li, pane;
			for (i = 0; i < data.length; i++) {
				pane = new DataListItem({
					data: data[i]._source,
					label: data[i]._source.actor.displayName
				});
				this.accordion.addChild(pane);
			}
			this.loading = false;

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
		}
	});
});
