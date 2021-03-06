define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/date/locale',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/text!./ImportOpListItem.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, lang, locale, domAttr, domClass, domConstruct, on, xhr, template, _WidgetBase, _TemplatedMixin) {
	return declare([_WidgetBase, _TemplatedMixin], {

		baseClass: 'importOp',

		importOp: null,

		templateString: template,

		_setImportOpAttr: function(importOp) {
			this._set('importOp', importOp);

			this.typeNode.innerHTML = importOp.source_type.capitalize();

			if (importOp.source_type === 'file') {
				this.specNode.innerHTML = importOp.source_spec.path;
				if (importOp.source_spec.preserve_fields !== undefined) {
					this.specNode.innerHTML += '<br>Preserve fields: ' + importOp.source_spec.preserve_fields.map(function(f) { return '"' + f + '"'; }).join(', ');
				}
			}
			else if (importOp.source_type === 'gnip') {
				this.specNode.innerHTML = '"' + importOp.source_spec.rule + '"';
			}
			else if (importOp.source_type === 'twitter') {
				this.specNode.innerHTML = importOp.source_spec.track.map(function(k) { return '\'' + k + '\''; }).join(', ');
			}

			if (importOp.convert === true) {
				this.conversionNode.innerHTML = 'Format converted from ' + importOp.from_format.formatSymbolForDisplay() + ' to ' + importOp.to_format.formatSymbolForDisplay();
				domClass.remove(this.conversionNode, 'hidden');
			}
			else {
				domClass.add(this.conversionNode, 'hidden');
			}

			var fmt = {
				datePattern: 'EEE M/d/yyy',
				timePattern: 'h:mm:ss a z'
			};

			var stopTime = null;
			if (importOp.time_stopped !== null) {
				stopTime = new Date(Date.parse(importOp.time_stopped));
			}

			if (importOp.time_started !== null) {
				domClass.remove(this.startTimeNode, 'hidden');
				this.startTimeNode.innerHTML = 'Started ' + locale.format(new Date(Date.parse(importOp.time_started)), fmt);
			}
			else {
				domClass.add(this.startTimeNode, 'hidden');
			}

			if (importOp.time_stopped !== null) {
				domClass.remove(this.stopTimeNode, 'hidden');
				this.stopTimeNode.innerHTML = 'Stopped ' + locale.format(new Date(Date.parse(importOp.time_stopped)), fmt);
			}
			else {
				domClass.add(this.stopTimeNode, 'hidden');
			}

			switch (importOp.status) {
				case 'pending':
					this.statusNode.style.color = '';
					this.statusNode.innerHTML = 'Pending';
					break;
				case 'in_progress':
					this.statusNode.style.color = '#3bafda';
					this.statusNode.innerHTML = 'In progress (' + importOp.worker_hostname + ' PID ' + importOp.worker_pid + ')';
					break;
				case 'failed':
					this.statusNode.style.color = '#da4453';
					this.statusNode.innerHTML = 'Failed (' + importOp.error_message + ')';
					break;
				case 'aborted':
					this.statusNode.style.color = '#8cc152';
					this.statusNode.innerHTML = 'Stopped by user';
					break;
				case 'completed':
					this.statusNode.style.color = '#8cc152';
					this.statusNode.innerHTML = 'Completed successfully';
					break;
			}

			if (importOp.status === 'in_progress' || importOp.status === 'pending') {
				this.stopButton = domConstruct.create('button', {
					'class': 'danger',
					innerHTML: (importOp.status === 'in_progress' ? 'Stop' : 'Cancel')
				}, this.domNode);
				this.stopClickSignal = on(this.stopButton, 'click', lang.hitch(this, this.stopImport));
			} else if (this.stopButton) {
				this.stopClickSignal.remove();
				domConstruct.destroy(this.stopButton);
				this.stopButton = null;
			}
		},

		stopImport: function() {
			if (!this.importOp) {
				return;
			}

			domAttr.set(this.stopButton, 'disabled', 'disabled');
			if (this.stopErrorNode) {
				domConstruct.destroy(this.stopErrorNode);
				this.stopErrorNode = null;
			}
			var spinner = domConstruct.create('span', {
				'class': 'fa fa-spinner fa-spin',
				style: {
					'margin-right': '6px'
				}
			}, this.stopButton, 'first');
			xhr.del('/api/v0/datasets/' + this.importOp.dataset_id + '/imports/' + this.importOp.id).response.then(
				lang.hitch(this, function() {
					domAttr.remove(this.stopButton, 'disabled');
					domConstruct.destroy(spinner);
					this.stopClickSignal.remove();
					domConstruct.destroy(this.stopButton);
					this.stopButton = null;
					this.statusNode.style.color = '#8cc152';
					this.statusNode.innerHTML = 'Stopped by user';

					if (this.importOp.status === 'pending') {
						this.destroy();
					}
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.stopButton, 'disabled');
					this.stopErrorNode = domConstruct.create('div', {
						'class': 'alert error',
						innerHTML: 'Unable to ' + (this.importOp.status === 'in_progress' ? 'stop' : 'cancel')  + ' import',
						style: { width: '300px' }
					}, this.stopButton, 'after');
					domConstruct.destroy(spinner);
					console.error(err);
				}));
		}
	});
});
