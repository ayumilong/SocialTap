define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/date/locale',
		'dojo/Deferred',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/request/xhr',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/views/ModuleView',
		'dojo-mama/views/DataListView',
		'../util/Dialog',
		'../vis/Inquiry'
], function(declare, lang, locale, Deferred, domAttr, domConstruct, on, xhr, BaseListItem, ModuleView, DataListView, Dialog, Inquiry) {
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
			var deleteButton = domConstruct.create('button', {
				'class': 'button',
				innerHTML: (obj.status == 'Ready') ? 'Delete this Report' : 'Cancel this Report',
			}, li.domNode);
			on(deleteButton, 'click', lang.hitch(this, function() {
				domAttr.set(deleteButton, 'disabled', 'disabled');
				this.deleteReport(obj.id).then(function() {
					li.destroy();
				}, function() {
					var dlg = new Dialog({
						title: 'Error'
					});
					dlg.containerNode.innerHTML = 'Unable to delete report';
					dlg.show();
				});
			}));
			return li;
		},

		deleteReport: function(reportId) {
			console.log('Delete ' + reportId);

			var d = new Deferred();

			xhr.del('/api/v0/reports/' + reportId).response.then(
				function() {
					d.resolve();
				},
				function(err) {
					console.error(err);
					d.reject(err);
				});

			return d;
		}

	});
});
