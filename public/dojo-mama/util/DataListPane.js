define(['dojo/_base/declare',
		'dojo/dom-construct',
		'dojox/mobile/EdgeToEdgeList',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataPane'
], function(declare, domConstruct, EdgeToEdgeList, BaseListItem, DataPane) {
	return declare([DataPane], {

		handleData: function(data) {

			domConstruct.empty(this.contentNode);

			var list = new EdgeToEdgeList();
			list.placeAt(this.contentNode);
			list.startup();

			var i, li;
			for (i = 0; i < data.length; i++) {
				li = this.buildListItem(data[i], i);
				list.addChild(li);
				li.startup();
			}
		},

		buildListItem: function(dataObject, index) {
			console.warn('Subclasses of DataListPane should override buildListItem');

			return new BaseListItem({
				text: 'Item ' + index
			});
		}

	});
});
