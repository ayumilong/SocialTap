class DataMapping < ActiveRecord::Base

	belongs_to :file_data_source

	serialize :options, Hash

	# Block to be called if the data mapping encounters an error while processing
	def on_error(&block)
		@on_error = block
	end

	# Process file at the specified path
	# This function should yield each item extracted from the file as a hash
	def process(path)
		raise NotImplementedError
	end

end
