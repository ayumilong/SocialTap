define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/date/locale',
		'dojo/dom-construct',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/views/ModuleView',
		'dojo-mama/views/DataListView',
		'../vis/Inquiry'
], function(declare, lang, locale, domConstruct, BaseListItem, ModuleView, DataListView, Inquiry) {
	return declare([DataListView], {

		'class': 'reportsListView',

		dataUrl: '/api/v0/reports.json',

		dateFormat: {
			datePattern: 'EEE M/d/yyy',
			timePattern: 'h:mm:ss a z'
		},

		noResultsMessage: 'No reports found',

		route: '/',

		title: 'Available Reports',

		buildListItem: function(obj) {
			var li = new BaseListItem({
				text:
					'Requested: ' + locale.format(new Date(Date.parse(obj.created_at)), this.dateFormat) + '<br>' +
					'Status: ' + obj.status + '<br>' +
					'Dataset: <a href="#/datasets/' + obj.dataset.id + '">' + obj.dataset.name + '</a><br>' +
					'Inquiry:<br>' +Inquiry.definitionToString(obj.inquiry_definition).replace(/\n/g, '<br>')
			});
			return li;
		}

	});
});
