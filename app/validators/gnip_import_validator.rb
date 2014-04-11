class GnipImportValidator

	def initialize(import_op)
		@import_op = import_op
	end

	def validate
		if @import_op.source_spec['rule'].blank?
			@import_op.errors.add("source_spec.rule", "is required")
		else
			rule = GnipRule::Rule.new(@import_op.source_spec['rule'])
			if !rule.valid?
				@import_op.errors.add("source_spec.rule", "is invalid")
			end
		end

		if @import_op.convert? && @import_op.from_format != 'activity_stream'
			@import_op.errors.add(:from_format, "Data from Gnip sources is in the Activity Stream format")
		end
	end

end
