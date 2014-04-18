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

		# Require that the user who started the import have a Twitter account connected
		if @import_op.started_by.connected_accounts.select { |acct| acct.provider == 'twitter' } .empty?
			@import_op.errors.add("source_type", "This import type requires a connected Twitter account")
		end
	end

end
