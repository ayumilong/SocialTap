class TwitterImportValidator

	def initialize(import_op)
		@import_op = import_op
	end

	def validate
		if @import_op.source_spec["track"].blank?
			@import_op.errors.add("source_spec.track", "At least one topic is required.")
		end

		@import_op.source_spec["track"].each do |keyword|
			if keyword.length > 60
				@import_op.errors.add("source_spec.track", "Keyword")
				break
			end
		end
	end

end
