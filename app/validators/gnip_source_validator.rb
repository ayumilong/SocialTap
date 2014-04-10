class GnipSourceValidator

	def initialize(spec)
		@spec = spec
	end

	def validate
		errors = Hash.new

		if @spec['rule'].blank?
			errors[:rule] = "is required"
		else
			rule = GnipRule::Rule.new(@spec['rule'])
			if !rule.valid?
				errors[:rule] = "is invalid"
			end
		end

		if @spec['convert'] && @spec['from_format'] != 'activity_stream'
			errors[:from_format] = "Data from Gnip sources is in the Activity Stream format"
		end

		errors
	end

end
