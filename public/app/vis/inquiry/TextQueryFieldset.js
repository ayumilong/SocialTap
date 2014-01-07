define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojox/mobile/CheckBox',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox'
], function(declare, lang, domClass, domConstruct, CheckBox, Pane, TextBox) {
	return declare([Pane], {

		'class': 'textQueryFieldset',

		fieldsSelectionNode: null,

		// includeExtraFields: Boolean
		//     Whether or not to include other fields besides the post
		//     body in the text search.
		includeExtraFields: false,

		// includeFieldsCheckbox: Object
		//     Checkbox to select whether to include extra fields or not.
		includeFieldsCheckbox: null,

		// label: String
		//     Label for this fieldset.
		label: null,

		// queryField: Object
		//     Text box for filter query.
		queryField: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Query'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			this.queryField = new TextBox({
				placeHolder: 'Query',
				trim: true
			});
			this.queryField.placeAt(fieldsetNode);

			this.includeFieldsCheckbox = new CheckBox();
			this.includeFieldsCheckbox.placeAt(fieldsetNode);
			this.includeFieldsCheckbox.set('onChange', lang.hitch(this, function() {
				this.set('includeExtraFields', !this.includeExtraFields);
			}));

			domConstruct.create('label', {
				'for': this.includeFieldsCheckbox.get('id'),
				innerHTML: 'Include additional fields:'
			}, this.includeFieldsCheckbox.domNode, 'before');

			this.fieldsSelectionNode = domConstruct.create('div', {
				'class': 'hidden'
			}, fieldsetNode);

		},

		buildInquiryPart: function() {

			var query = this.queryField.get('value');

			if (!query) {
				return null;
			}

			return {
				type: 'text',
				value: query,
				fields: ['body']
			};
		},

		reset: function() {
			this.queryField.set('value', '');
			this.includeFieldsCheckbox.set('checked', false);
		},

		_setIncludeExtraFieldsAttr: function(includeExtraFields) {
			this._set('includeExtraFields', includeExtraFields);

			if (includeExtraFields) {
				domClass.remove(this.fieldsSelectionNode, 'hidden');
			}
			else {
				domClass.add(this.fieldsSelectionNode, 'hidden');
			}
		}

	});
});
