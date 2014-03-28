require 'gnip-rule'

module Import
module Source

class GnipSource < BaseSource

	# Validate rule.
	def self.validate_spec(spec)
		true
	end

	# Read from Gnip stream connection.
	def each_doc

	end

end

end
end
