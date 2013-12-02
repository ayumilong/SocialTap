class FileDataSourceFile < ActiveRecord::Base
	belongs_to :file_data_source

	attr_readonly :path
	attr_readonly :format

	# Ensure the file can be read
	validate :validate_file_existence
	def validate_file_existence
		begin
			f = File.open(path, "r")
			f.close
		rescue
			errors[:file] << ("Unable to read " + path)
		end
	end
end
