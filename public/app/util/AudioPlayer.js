define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojox/mobile/Audio',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojox/mobile/Slider',
		'app/util/dom-utils',
		'dojo-mama/util/toaster'
], function(declare, lang, domClass, domConstruct, on, Audio, Button, Pane, Slider, domUtils, toaster) {
	return declare([Pane], {

		'class': 'audioPlayer',

		// audio: dojox/mobile/Audio
		audio: null,

		// audioEventHandles: Array
		//     Array of dojo/on handles for audio event listeners.
		audioEventHandles: null,

		// loadingNode: DomNode
		//     Container for 'Loading' message
		loadingNode: null,

		// playButton: dojox/mobile/Button
		//     Play/pause button.
		playButton: null,

		// selectedSource: Integer
		//     The index of the selected source in the sources array.
		selectedSource: 0,

		// sources: Array
		//     Array of url, type, and label (ex [{url: 'http://wsbf.net:8000/high', type: 'audio/mp3', label: '192 kbps'}])
		//     for sources to choose from.
		sources: null,

		// sourceButtons: Array
		//     Array of dojox/mobile/Buttons for selecting source to play from list.
		sourceButtons: null,

		// sourcesNode: DomNode
		//     Container for source select buttons.
		sourcesNode: null,

		// volumeSlider: dojox/mobile/Slider
		//     Slider to adjust the audio volume.
		volumeSlider: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.playButton = new Button({
				'class': 'button playButton icon-play',
				duration: 0
			});
			this.playButton.placeAt(this.domNode);
			this.playButton.startup();

			this.playButton.set('onClick', lang.hitch(this, function() {
				if (!this.audio || this.audio.domNode.paused) {
					this.play();
					domClass.replace(this.playButton.domNode, 'icon-pause', 'icon-play');
				}
				else {
					this.pause();
					domClass.replace(this.playButton.domNode, 'icon-play', 'icon-pause');
				}
				domUtils.cufonify();
			}));

			this.volumeSlider = new Slider({
				'class': 'volumeSlider',
				min: 0,
				max: 1.0,
				step: 0,
				orientation: 'H',
				intermediateChanges: true,
				value: 0.5
			});
			this.volumeSlider.placeAt(this.containerNode);
			this.volumeSlider.startup();
			this.volumeSlider.set('onChange', lang.hitch(this, function(val) {
				if (this.audio) {
					this.audio.domNode.volume = val;
				}
			}));

			this.loadingNode = domConstruct.create('div', {
				'class': 'loadingContainer'
			}, this.domNode);

			this.sourcesNode = domConstruct.create('div', {
				'class': 'sourcesContainer'
			}, this.domNode);
		},

		addSourceButton: function(/*Object*/ source, /*Integer*/ index) {
			// summary:
			//     Create a new button for selecting a source to play and place it in the DOM node.
			// source: Object
			//     The source tied to this button.
			// index: Integer
			//     The index of source in the this.sources array.

			var button = new Button({
				'class': 'button sourceButton',
				duration: 0,
				label: source.label
			});

			if (index == this.selectedSource) {
				domClass.add(button.domNode, 'selected');
			}

			button.set('onClick', lang.hitch(this, function() {

				var i;
				for (i = 0; i < this.sourceButtons.length; i++) {
					domClass.remove(this.sourceButtons[i].domNode, 'selected');
				}

				domClass.add(button.domNode, 'selected');

				this.set('selectedSource', index);
			}));

			this.sourceButtons.push(button);

			button.placeAt(this.sourcesNode);
		},

		_setSourcesAttr: function(/*Array*/ sources) {
			// summary:
			//     Set the list of available sources to choose from.

			this._set('sources', sources);

			domConstruct.empty(this.sourcesNode);

			this.pause();

			this.selectedSource = 0;

			this.sourceButtons = [];
			var i;
			for (i = 0; i < sources.length; i++) {
				this.addSourceButton(sources[i], i);
			}
		},

		pause: function() {
			// summary:
			//     Pause the audio.

			if (this.audio && !this.audio.paused) {

				var i;
				for (i = 0; i < this.audioEventHandles.length; i++) {
					this.audioEventHandles[i].remove();
				}

				this.loadingNode.innerHTML = '';

				this.audio.domNode.pause();
				this.audio.domNode.src = '';
				this.audio.destroy();
				this.audio = null;
			}
		},

		play: function() {
			// summary:
			//     Play the audio.

			var s = this.sources[this.selectedSource];
			this.audio = new Audio({
				source: [
					{src: s.url, type: s.type}
				]
			});
			this.audio.domNode.volume = this.volumeSlider.get('value');
			this.audio.placeAt(this.domNode);

			this.audioEventHandles = [];

			var handle = on(this.audio.domNode, 'waiting', lang.hitch(this, function() {
				this.loadingNode.innerHTML = 'Loading...';

			}));
			this.audioEventHandles.push(handle);

			handle = on(this.audio.domNode, 'loadeddata', lang.hitch(this, function() {
				this.loadingNode.innerHTML = '';
			}));
			this.audioEventHandles.push(handle);

			handle = on(this.audio.domNode, 'error', lang.hitch(this, function() {
				this.loadingNode.innerHTML = '';
				toaster.displayMessage({
					text: 'Failed to load stream',
					type: 'error',
					time: -1
				});
				this.pause();
			}));
			this.audioEventHandles.push(handle);

			this.audio.domNode.play();
		},

		_setSelectedSourceAttr: function(/*Integer*/ selectedSource) {
			// summary:
			//     Set which of the available sources to play.
			// selectedSource: Integer
			//     The index of the source to play in the this.sources array.

			this._set('selectedSource', selectedSource);

			// If the old source was playing, stop it and start playing the new source.
			if (this.audio && !this.audio.domNode.paused) {
				this.pause();
				this.play();
			}
		}

	});
});
