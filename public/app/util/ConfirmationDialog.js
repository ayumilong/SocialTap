define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojox/mobile/Button',
		'app/util/Dialog'
], function(declare, lang, Button, Dialog) {
	return declare([Dialog], {

		cancelButton: null,
		'class': 'confirmationDialog',
		message: null,
		messageNode: null,
		onCancel: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.cancelButton = new Button({
				'class': 'button cancelButton',
				duration: 0,
				label: 'Cancel',
				onClick: lang.hitch(this, function() {
					this.close();
				})
			});
			this.cancelButton.placeAt(this.buttonsNode, 'first');

		},

		_setOnCancelAttr: function(onCancel) {
			this._set('onCancel', onCancel);

			this.cancelButton.set('onClick', lang.hitch(this, function() {
				this.close();
				onCancel();
			}));
		}

	});
});
