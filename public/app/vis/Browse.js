define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojox/mobile/EdgeToEdgeList',
		'dijit/_WidgetBase',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/_InfiniteScrollMixin',
		'./DataAccordion',
		'./DataListItem'
], function(declare, lang, xhr, EdgeToEdgeList, WidgetBase, BaseListItem, InfiniteScroll,
		DataAccordion, DataListItem)
{
	return declare([WidgetBase, InfiniteScroll], {

		'class': 'vis',

		// datasetId: Integer
		//     ID of dataset to run inquiry against.
		datasetId: null,

		// inquiry: Object
		//     Inquiry to run/display.
		inquiry: null,

		list: null,

		// orderBy: String
		//     Field to order results by.
		//     TODO: This shouldn't be hard coded as there's no guarantee
		//     the dataset contains activities.
		orderBy: "postedTime",

		// orderAsc: Boolean
		//     Get results in ascending/descending order.
		orderAsc: true,

		// pageSize: Integer
		//     Number of results to fetch in each page.
		pageSize: 30,

		buildRendering: function() {
			this.inherited(arguments);

			this.list = new DataAccordion();
			this.list.placeAt(this.domNode);
			this.list.startup();
		},

		handlePageData: function(data, pageNumber) {
			console.log('handle data for page ' + pageNumber);

			console.log(data);

			var i, li;
			for (i = 0; i < data.hits.hits.length; i++) {
				li = new DataListItem({
					data: data.hits.hits[i]._source,
					label: data.hits.hits[i]._source.actor.displayName
				});
				this.list.addChild(li);
			}
		},

		reload: function() {
			this.list.clear();
			this.resetInfiniteScroll();
			this.loadPage(0);
		},

		requestForPage: function(pageNumber) {
			// TODO:
			//     Inquiry should not be hard coded.
			//     Inquiry should not be a raw Elasticsearch query
			//     Order field, order asc/desc, limit, offset, should
			//       be passed separately, not mixed in to inquiry.

			var query = {
				elasticsearch : {
					size: this.pageSize,
					from: (pageNumber * this.pageSize),
					sort: [{}],
					query: {
						match_all: {}
					}
				}
			};

			query.elasticsearch.sort[0][this.orderBy] = {
				mode: 'min',
				order: (this.orderAsc ? 'asc' : 'desc')
			};

			return xhr.post('/api/v0/datasets/' + this.datasetId + '/search', {
				data: JSON.stringify(query),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response;
		}

		// TODO:
		//     Call reload whenever orderBy, orderAsc, or pageSize is changed.

	});
});
