define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/query',
		'dijit/_WidgetBase'
], function(declare, lang, domAttr, domConstruct, on, query, WidgetBase) {
	return declare([WidgetBase], {
		'class': 'dmSelect',

		// onChange: function
		//     Callback for when the selection changes
		//     Called with new value
		'onChange': null,

		// onChangeHanlde: object
		//     dojo/on handle for select event.
		onChangeHandle: null,

		// options: array
		//     Array of objects {val:, label:}
		options: null,

		// value: string
		//     Value of the selected option.
		value: null,

		buildRendering: function() {
			this.domNode = domConstruct.create('select');
		},

		destroy: function() {
			if (this.onChangeHandle) {
				this.onChangeHandle.remove();
			}
			this.inherited(arguments);
		},

		_setOnChangeAttr: function(onChange) {
			this._set('onChange', onChange);
			if (this.onChangeHandle) {
				this.onChangeHandle.remove();
			}

			this.onChangeHandle = on(this.domNode, 'change', lang.hitch(this, function() {
				onChange(this.get('value'));
			}));
		},

		_setOptionsAttr: function(options) {
			this._set('options', options);

			domConstruct.empty(this.domNode);

			var i;
			for (i = 0; i < options.length; i++) {
				domConstruct.create('option', {
					value: options[i].value,
					innerHTML: options[i].label
				}, this.domNode);
			}
		},

		_getValueAttr: function() {
			var value = null;
			query('option', this.domNode).forEach(function(optionNode) {
				if (domAttr.get(optionNode, 'selected')) {
					value = domAttr.get(optionNode, 'value');
					return false;
				}
			});
			return value;
		},

		_setValueAttr: function(value) {
			query('option', this.domNode).forEach(function(optionNode) {
				if (value == domAttr.get(optionNode, 'value')) {
					domAttr.set(optionNode, 'selected', 'selected');
				}
				else {
					domAttr.remove(optionNode, 'selected');
				}
			});
		}


	});
});
