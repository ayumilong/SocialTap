define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/_base/window',
		'dojo/Deferred',
		'dojo/dom-construct',
		'dojo/dom-geometry',
		'dojo/dom-style',
		'dojo/on',
		'dojo/text!./Dialog.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, lang, win, Deferred, domConstruct, domGeom, domStyle, on,
	template, _WidgetBase, _TemplatedMixin)
{
	return declare([_WidgetBase, _TemplatedMixin], {

		baseClass: 'dialog',

		// buttonClickHandles: Object[]
		//     dojo/on handles for button click events.
		buttonClickHandles: null,

		// showPromise: Object
		//     Deferred returned by show, fulfilled when a button is clicked.
		showPromise: null,

		templateString: template,

		// title: String
		//     Dialog title.
		title: 'Alert',

		addButton: function(key, label) {
			// summary:
			//     Add a button to the dialog.
			// key: String
			//     When a button is pressed, the promise returned by show is fulfilled with
			//     the key for the button pressed.
			// label: String
			//     The text displayed on the button.

			var button = domConstruct.create('button', {
				'class': 'button',
				innerHTML: label
			}, this.buttonsNode);

			var handle = on(button, 'click', lang.hitch(this, function() {
				if (this.showPromise) {
					this.showPromise.resolve(key);
					this.destroyRecursive();
				}
			}));

			this.buttonClickHandles.push(handle);
		},

		constructor: function() {
			this.buttonClickHandles = [];
		},

		destroy: function() {
			domConstruct.destroy(this.overlayNode);

			for (var i = 0; i < this.buttonClickHandles.length; i++) {
				this.buttonClickHandles[i].remove();
			}
			this.inherited(arguments);
		},

		postCreate: function() {
			this.inherited(arguments);

			this.overlayNode = domConstruct.create('div', {
				'class': 'dialogOverlay'
			});
		},

		_setTitleAttr: function(title) {
			this._set('title', title);
			this.titleNode.innerHTML = title;
		},

		show: function() {
			// summary:
			//     Show the dialog.
			// returns:
			//     Promise fulfilled when the user clicks a button.

			// Default to a single 'OK' button if no buttons have been added.
			if (this.buttonClickHandles.length === 0) {
				this.addButton('ok', 'OK');
			}

			domConstruct.place(this.overlayNode, win.body());
			this.placeAt(win.body());
			this.startup();

			this.showPromise = new Deferred();
			return this.showPromise;
		},

		startup: function() {
			this.inherited(arguments);

			// Vertically center dialog.
			var box = domGeom.getMarginBox(this.domNode);
			domStyle.set(this.domNode, 'marginTop', -(box.h / 2) + 'px');
		}
	});
});
