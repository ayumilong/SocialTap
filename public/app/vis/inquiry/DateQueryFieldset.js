define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojox/mobile/CheckBox',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox'
], function(declare, lang, domAttr, domConstruct, Evented, CheckBox, Pane, TextBox) {
	return declare([Pane, Evented], {

		'class': 'dateQueryFieldset',

		// days: Array
		//     Array of labels for days.
		days: null,

		// dayCheckBoxes: Array
		//     Array of checkboxes for individual days.
		dayCheckBoxes: null,

		// endField: Object
		//     Text box for end of date range.
		endField: null,

		// label: String
		//     Label for this fieldset.
		label: null,

		// startField: Object
		//     Text box for start of date range.
		startField: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Date Query'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			var changeHandler = lang.hitch(this, function() {
				this.emit('change', this.buildInquiryPart());
			});

			this.startField = new TextBox({
				'class': 'start',
				onChange: changeHandler,
				placeHolder: 'Start',
				trim: true
			});
			domAttr.set(this.startField.domNode, 'type', 'date');
			this.startField.placeAt(fieldsetNode);

			domConstruct.create('span', {
				innerHTML: ' - '
			}, fieldsetNode);

			this.endField = new TextBox({
				'class': 'end',
				onChange: changeHandler,
				placeHolder: 'End',
				trim: true
			});
			domAttr.set(this.endField.domNode, 'type', 'date');
			this.endField.placeAt(fieldsetNode);

			this.days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
			this.dayCheckBoxes = [];
			var i, cb;
			for (i = 0; i < this.days.length; i++) {
				cb = new CheckBox({
					name: this.days[i],
					onChange: changeHandler,
				});
				cb.placeAt(fieldsetNode);
				this.dayCheckBoxes.push(cb);

				domConstruct.create('label', {
					'for': cb.get('id'),
					innerHTML: this.days[i]
				}, cb.domNode, 'before');
			}
		},

		buildInquiryPart: function() {
			return {
				type: 'dateQuery',
				field: 'postedTime',
				range: {
					start: this.startField.get('value'),
					end: this.endField.get('value')
				},
				days: this.days.filter(lang.hitch(this, function(d, index) {
					return this.dayCheckBoxes[index].get('checked');
				}))
			};
		},

		reset: function() {
			this.startField.set('value', '');
			this.endField.set('value', '');
			var d;
			for (d in this.dayCheckBoxes) {
				if (this.dayCheckBoxes.hasOwnProperty(d)) {
					this.dayCheckBoxes[d].set('checked', false);
				}
			}
		}

	});
});
