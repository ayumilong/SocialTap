class FileImportValidator

	def initialize(import_op)
		@import_op = import_op
	end

	def validate
		if @import_op.source_spec['path'].blank?
			@import_op.errors.add("source_spec.path", "is required")
		else
			path = File.expand_path(@import_op.source_spec['path'])
			if !File.file?(path) || !File.readable?(path)
				@import_op.errors.add("source_spec.path", "is unreadable")
			end
		end
	end

end
