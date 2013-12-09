define(['dojo/_base/declare',
		'dojo-mama/util/BaseListItem'],
function(declare, BaseListItem) {
	return declare([BaseListItem], {

		'class': 'importOpListItem',

		importOp: null,

		_setImportOpAttr: function(importOp) {
			this._set('importOp', importOp);

			var startTime = new Date(Date.parse(importOp.time_started));
			var stopTime = (importOp.time_stopped !== null) ? new Date(Date.parse(importOp.time_stopped)) : null;

			var source;
			if (importOp.data_source.type === 'FileDataSource') {
				source = 'File: ' + importOp.data_source.file.path;
			}
			else if (importOp.data_source.type === 'GnipDataSource') {
				source = 'Gnip Rule: ' + importOp.data_source.rule.value;
			}

			var text = '';
			text += '<span class="startTime">Started ' + startTime.toLocaleDateString() + ' ' + startTime.toLocaleTimeString() + '</span>';
			text += '<br>';
			text += '<span class="source">' + source + '</span>';
			text += '<br>';
			if (importOp['in_progress?']) {
				text += '<span class="status"><span style="color: green;">In Progress</span></span>';
			}
			else {
				var stopMessage = (importOp['failed?']) ? 'Stopped ' : 'Completed ';
				stopMessage += stopTime.toLocaleDateString() + ' ' + stopTime.toLocaleTimeString();
				if (importOp['failed?']) {
					stopMessage = '<span style="color: red;">' + stopMessage + ' (' + importOp.stop_error_message + ')</span>';
				}
				text += '<span class="status">' + stopMessage + '</span>';
			}

			text += '<br>';
			text += '<span class="activityCount">' + importOp.activities_imported + ' activities imported</span>';

			this.set('text', text);
		}
	});
});
