class GnipSourceValidator

	def initialize(spec)
		@spec = spec
	end

	def validate
		errors = Hash.new

		rule = GnipRule::Rule.new(@spec['rule'])
		if !rule.valid?
			errors[:rule] = ["is invalid"]
		end

		errors
	end

end
