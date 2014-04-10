class FileSourceValidator

	def initialize(spec)
		@spec = spec
	end

	def validate
		errors = Hash.new

		if @spec['path'].blank?
			errors[:path] = "is required"
		else
			path = File.expand_path(@spec['path'])
			if !File.exists?(path) || !File.readable?(path)
				errors[:path] = "is unreadable"
			end
		end

		errors
	end

end
