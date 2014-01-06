define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojox/mobile/CheckBox',
		'dojox/mobile/Pane'
], function(declare, lang, domAttr, domConstruct, Evented, CheckBox, Pane) {
	return declare([Pane, Evented], {
		'class': 'sentimentQueryFieldset',

		checkboxes: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Sentiment'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			var changeHandler = lang.hitch(this, function() {
				this.emit('change', this.buildInquiryPart());
			});

			this.checkboxes = {};
			var sentiments = ['Positive', 'Neutral', 'Negative'];
			var i, label, cb;
			for (i = 0; i < sentiments.length; i++) {
				label = domConstruct.create('label', {
					innerHTML: sentiments[i]
				}, fieldsetNode);

				cb = new CheckBox({
					onChange: changeHandler
				});
				cb.placeAt(label);

				domAttr.set(label, 'for', cb.get('id'));

				this.checkboxes[sentiments[i]] = cb;
			}
		},

		buildInquiryPart: function() {
			var inquiryPart = {
				type: 'sentiment',
				field: 'sentiment'
			};

			var sentiments = ['Positive', 'Neutral', 'Negative'];
			var i;
			for (i = 0; i < sentiments.length; i++) {
				inquiryPart[sentiments[i]] = this.checkboxes[sentiments[i]].get('checked');
			}
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
