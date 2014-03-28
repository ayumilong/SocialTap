module Import
module Source

class BaseSource

	def initialize(spec)
		@spec = spec
	end

	# Validate a source specification.
	#
	# @param spec [Hash] a specification for a consumption source.
	# @return [Boolean] whether or not the specification is valid for this source type.
	def self.validate_spec(spec)
		raise NotImplementedError
	end

	# Yield docs from source.
	def each_doc
		raise NotImplementedError
	end

end

end
end
