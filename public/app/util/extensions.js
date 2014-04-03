define([], function() {
	// summary:
	//     Extensions to built in types.

	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};

});
