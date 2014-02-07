define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/query',
		'dojo/request/xhr',
		'./Inquiry',
		'../util/Dialog'
], function(declare, lang, Deferred, domClass, domConstruct, query, xhr, Inquiry, Dialog) {
	return declare([Dialog], {

		'class': 'inquiryLoadDialog',

		// datasetId: Integer
		//     The ID of the dataset to show inquiries for.
		datasetId: null,

		// inquiries: Object[]
		//     Inquiries available for the specified dataset.
		inquiries: null,

		title: 'Load Inquiry',

		_buildInquiryListItem: function(inquiry) {
			var row = domConstruct.create('div', { 'class': 'row' });

			domConstruct.create('input', {
				id: 'loadInquiry' + inquiry.id,
				name: 'inquiry',
				type: 'radio',
				value: inquiry.id
			}, row);

			domConstruct.create('label', {
				'for': 'loadInquiry' + inquiry.id,
				innerHTML: inquiry.toString().split('\n').join('<br>')
			}, row);

			return row;
		},

		_getSelectedInquiryAttr: function() {
			var id = query('input:checked', this.containerNode)[0].value;
			for (var i = 0; i < this.inquiries.length; i++) {
				if (this.inquiries[i].id == id) {
					return this.inquiries[i];
				}
			}
			return null;
		},

		loadInquiries: function() {
			domConstruct.empty(this.containerNode);

			this.containerNode.innerHTML = 'Loading...';

			Inquiry.loadAll({dataset_id: this.datasetId}).then(lang.hitch(this, function(inquiries) {
				this.inquiries = inquiries;
				if (inquiries.length === 0) {
					this.containerNode.innerHTML = 'No inquiries available';
				}
				else {
					this.containerNode.innerHTML = '';

					var i, row;
					domConstruct.create('h4', {
						innerHTML: 'Recent Inquiries'
					}, this.containerNode);
					for (i = 0; i < 5 && i < inquiries.length; i++) {
						row = this._buildInquiryListItem(inquiries[i]);
						domConstruct.place(row, this.containerNode);
					}

					if (inquiries.length > 5) {
						domConstruct.create('h4', {
							innerHTML: 'Other Saved Inquiries'
						}, this.containerNode);
						for (i = 5; i < inquiries.length; i++) {
							row = this._buildInquiryListItem(inquiries[i]);
							domConstruct.place(row, this.containerNode);
						}
					}
				}
			}));
		},

		postCreate: function() {
			this.inherited(arguments);
			this.addButton('load', 'Load');
			this.addButton('cancel', 'Cancel');
		},

		show: function() {
			this.inherited(arguments);

			var d = new Deferred();
			this.showPromise.then(lang.hitch(this, function(buttonId) {
				if (buttonId == 'load') {
					d.resolve(this.get('selectedInquiry'));
				}
				else {
					d.cancel();
				}
			}));

			return d.promise;
		},

		startup: function() {
			this.inherited(arguments);
			console.warn('startup');
			this.loadInquiries();
		}

	});
});
