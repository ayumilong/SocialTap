class FileSourceValidator

	def initialize(spec)
		@spec = spec
	end

	def validate
		errors = Hash.new

		path = File.expand_path(@spec['path'])
		if !File.exists?(path) || !File.readable?(path)
			errors[:path] = ["is unreadable"]
		end

		errors
	end

end
