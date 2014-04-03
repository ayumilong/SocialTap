define(['dojo/_base/declare',
		'dojo/date/locale',
		'dojo/dom-class',
		'dojo/text!./ImportOpListItem.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, locale, domClass, template, _WidgetBase, _TemplatedMixin) {
	return declare([_WidgetBase, _TemplatedMixin], {

		'class': 'importOpListItem',

		importOp: null,

		templateString: template,

		_setImportOpAttr: function(importOp) {
			this._set('importOp', importOp);

			this.typeNode.innerHTML = importOp.source_type.capitalize();

			if (importOp.source_type === 'file') {
				this.specNode.innerHTML = importOp.source_spec.path;
			}
			else if (importOp.source_type === 'gnip') {
				this.specNode.innerHTML = '"' + importOp.source_spec.rule + '"';
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

			if (importOp.status === 'in_progress') {
				this.statusNode.style.color = '#3bafda';
				this.statusNode.innerHTML = 'In progress (' + importOp.worker_hostname + ' PID ' + importOp.worker_pid + ')';
			}
			else if (importOp.status == 'failed') {
				this.statusNode.style.color = '#da4453';
				this.statusNode.innerHTML = 'Failed (' + importOp.error_message + ')';
			}
			else {
				this.statusNode.style.color = '';
				if (importOp.status === 'completed') {
					this.statusNode.style.color = '#8cc152';
				}
				this.statusNode.innerHTML = importOp.status.capitalize();
			}
		}
	});
});
