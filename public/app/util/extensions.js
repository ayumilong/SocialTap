define([], function() {
	// summary:
	//     Extensions to built in types.

	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};

	String.prototype.isCapitalized = function() {
		var c = this.charAt(0);
		return (c === c.toUpperCase() && c !== c.toLowerCase());
	};

	String.prototype.formatSymbolForDisplay = function() {
		// summary:
		//     Converts strings like 'activity_stream' to 'Activity Stream'
		return this.replace(/_([a-z])/g, function(match, letter) { return " " + letter.toUpperCase(); }).capitalize();
	};

	Array.prototype.uniqueValues = function() {
		return this.filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});
	};

});
