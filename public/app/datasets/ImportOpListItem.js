define(['dojo/_base/declare',
		'dojo/date/locale',
		'dojo-mama/util/BaseListItem'],
function(declare, locale, BaseListItem) {
	return declare([BaseListItem], {

		'class': 'importOpListItem',

		importOp: null,

		_setImportOpAttr: function(importOp) {
			this._set('importOp', importOp);

			var startTime = new Date(Date.parse(importOp.time_started));
			var stopTime = (importOp.time_stopped !== null) ? new Date(Date.parse(importOp.time_stopped)) : null;

			var fmt = {
				datePattern: 'EEE M/d/yyy',
				timePattern: 'h:mm:ss a z'
			};

			var text = '';
			text += '<span class="startTime">Started ' + locale.format(startTime, fmt) + '</span>';
			text += '<br>';
			if (importOp.in_progress) {
				text += '<span class="status"><span style="color: green;">In Progress</span></span>';
			}
			else {
				var stopMessage = (importOp.failed) ? 'Stopped ' : 'Completed ';
				stopMessage += locale.format(stopTime, fmt);
				if (importOp.failed) {
					stopMessage = '<span style="color: red;">' + stopMessage + ' (' + importOp.error_message + ')</span>';
				}
				text += '<span class="status">' + stopMessage + '</span>';
			}

			this.set('text', text);
		}
	});
});
