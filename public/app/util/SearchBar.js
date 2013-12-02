define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/keys',
		'dojo/on',
		'dojox/mobile/Button',
		'dojox/mobile/TextBox',
		'dijit/_WidgetBase'
], function(declare, lang, domConstruct, keys, on, Button, TextBox, WidgetBase) {
	return declare([WidgetBase], {

		baseClass: 'searchBar',

		placeHolder: '',

		textBox: null,

		textBoxWrapper: null,

		searchButton: null,

		onChange: null,

		onKeyDownSignal: null,

		onClickSignal: null,

		onSearch: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.textBoxWrapper = domConstruct.create('div', {
				'class': 'textBoxWrapper'
			}, this.domNode);

			this.textBox = new TextBox({
				placeHolder: this.placeHolder,
				trim: true
			});
			this.textBox.placeAt(this.textBoxWrapper);
			this.textBox.startup();

			this.searchButton = new Button({
				'class': 'button searchButton',
				duration: 0,
				label: 'Search',
				title: 'Search'
			});
			this.searchButton.placeAt(this.domNode);
		},

		_getValueAttr: function() {
			return this.textBox.get('value');
		},

		_setValueAttr: function(/*String*/ value) {
			this.textBox.set('value', value);
		},

		_setOnChangeAttr: function(onChange) {
			this._set('onChange', onChange);

			this.textBox.set('intermediateChanges', (onChange !== null));

			this.textBox.set('onChange', lang.hitch(this, function() {
				onChange(this.textBox.get('value'));
			}));
		},

		_setOnSearchAttr: function(onSearch) {
			this._set('onSearch', onSearch);

			if (this.onClickSignal !== null) {
				this.onClickSignal.remove();
			}
			on(this.searchButton, 'click', lang.hitch(this, function() {
				this.onSearch(this.textBox.get('value'));
			}));

			// Allow searching by pressing enter button in text box
			if (this.onKeyDownSignal !== null) {
				this.onKeyDownSignal.remove();
			}
			this.onKeyDownSignal = this.textBox.on('keydown', lang.hitch(this, function(e) {
				if (e.keyCode == keys.ENTER) {
					this.onSearch(this.textBox.get('value'));
				}
			}));
		},

		_setPlaceHolderAttr: function(placeHolder) {
			this._set('placeHolder', placeHolder);
			this.textBox.set('placeHolder', placeHolder);
		},

		clear: function() {
			this.textBox.set('value', '');
		},

		destroy: function() {
			if (this.onKeyDownSignal !== null) {
				this.onKeyDownSignal.remove();
			}
			this.inherited(arguments);
		},

		focus: function() {
			this.textBox.domNode.focus();
		}

	});
});
