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

			var includeFieldsCheckbox = new CheckBox();
			includeFieldsCheckbox.placeAt(fieldsetNode);
			includeFieldsCheckbox.set('onChange', lang.hitch(this, function() {
				this.set('includeExtraFields', !this.includeExtraFields);
			}));

			domConstruct.create('label', {
				'for': includeFieldsCheckbox.get('id'),
				innerHTML: 'Include additional fields:'
			}, includeFieldsCheckbox.domNode, 'before');

			this.fieldsSelectionNode = domConstruct.create('div', {
				'class': 'hidden'
			}, fieldsetNode);

		},

		buildInquiryPart: function() {
			return {
				type: 'textQuery',
				value: this.queryField.get('value'),
				fields: ['body']
			};
		},

		reset: function() {
			this.queryField.set('value', '');
			this.includeExtraFields.set('checked', false);
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
