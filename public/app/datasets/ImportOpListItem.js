define(['dojo/_base/declare',
		'dojo-mama/util/BaseListItem'],
function(declare, BaseListItem) {
	return declare([BaseListItem], {

		'class': 'importOpListItem',

		importOp: null,

		_setImportOpAttr: function(importOp) {
			this._set('importOp', importOp);

			var label = '';

			if (importOp.data_source.type === 'FileDataSource') {
				label += 'File: ' + importOp.data_source.file.path;
			}

			else if (importOp.data_source.type === 'GnipDataSource') {
				label += 'Gnip Rule: ' + importOp.data_source.rule.value;
			}

			this.set('text', label);

			// TODO: Add other import operation attributes
		}
	});
});
