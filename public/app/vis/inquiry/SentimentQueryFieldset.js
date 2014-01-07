define(['dojo/_base/declare',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojox/mobile/CheckBox',
		'dojox/mobile/Pane'
], function(declare, domAttr, domConstruct, CheckBox, Pane) {
	return declare([Pane], {
		'class': 'sentimentQueryFieldset',

		checkboxes: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Sentiment'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			this.checkboxes = {};
			var sentiments = ['Positive', 'Neutral', 'Negative'];
			var i, label, cb;
			for (i = 0; i < sentiments.length; i++) {
				label = domConstruct.create('label', {
					innerHTML: sentiments[i]
				}, fieldsetNode);

				cb = new CheckBox();
				cb.placeAt(label, 'first');

				domAttr.set(label, 'for', cb.get('id'));

				this.checkboxes[sentiments[i]] = cb;
			}
		},

		buildInquiryPart: function() {

			// TODO: Implement this
			return null;

			var inquiryPart = {
				type: 'sentiment',
				field: 'sentiment'
			};

			var sentiments = ['Positive', 'Neutral', 'Negative'];
			var i;
			for (i = 0; i < sentiments.length; i++) {
				inquiryPart[sentiments[i]] = this.checkboxes[sentiments[i]].get('checked');
			}

			return inquiryPart;
		},

		reset: function() {
			var s;
			for (s in this.checkboxes) {
				if (this.checkboxes.hasOwnProperty(s)) {
					this.checkboxes[s].set('checked', false);
				}
			}
		}
	});
});
