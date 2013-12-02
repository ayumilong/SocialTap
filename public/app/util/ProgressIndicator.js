define(['dojo/_base/declare',
		'dojo/sniff',
		'dojox/mobile/ProgressIndicator'
], function(declare, has, ProgressIndicator) {
	return declare([ProgressIndicator], {

		// module:
		//   app/util/ProgressIndicator

		gif: '/app/resources/img/spinners/36x36.gif',

		buildRendering: function() {
			// summary:
			//    Fallback to animated gif for supported browsers without CSS3 support (IE8)
			var start;
			if (has('ie') && has('ie') < 9) {
				start = this.startSpinning;
				if (start) {
					this.startSpinning = false;
				}
				// call dojox.mobile.ProgressIndicator buildRendering
				// without starting the animation in order to get
				// the image node
				this.inherited(arguments);
				// set the animated gif
				this.setImage(this.gif);
				// then start, if needed
				if (start) {
					this.startSpinning = true;
					this.start();
				}
			} else {
				this.inherited(arguments);
			}
		}

	});
});
