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

		// onChangeHandle: object
		//     dojo/on handle for select event.
		onChangeHandle: null,

		// options: Object
		//     Options to populate select tag with.
		//     For a basic list of options, set with an array of objects {value:, label:}
		//     For optgroups, set with an object whose keys are the titles of the optgroups and
		//     values are an array of objects {value:, label:} of options for the optgroup.
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
			if (options.constructor == Array) {
				for (i = 0; i < options.length; i++) {
					domConstruct.create('option', {
						value: options[i].value,
						innerHTML: options[i].label
					}, this.domNode);
				}
			}
			else if (options.constructor == Object) {
				var group, groupNode;
				for (group in options) {
					if (options.hasOwnProperty(group)) {
						groupNode = domConstruct.create('optgroup', {
							label: group
						}, this.domNode);
						for (i = 0; i < options[group].length; i++) {
							domConstruct.create('option', {
								value: options[group][i].value,
								innerHTML: options[group][i].label
							}, groupNode);
						}
					}
				}
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
