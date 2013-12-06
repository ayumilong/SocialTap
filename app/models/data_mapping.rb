class DataMapping < ActiveRecord::Base

	belongs_to :file_data_source

	# Block to be called if the data mapping encounters an error while processing
	def on_error(&block)
		@on_error = block
	end

	# Process file at the specified path
	# This function should yield each activity extracted from the file
	def process(path)
		raise NotImplementedError
	end

end
