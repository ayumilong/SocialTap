class FileDataSource < DataSource
	has_one :file_data_source_file, dependent: :destroy
	has_one :data_mapping

	accepts_nested_attributes_for :file_data_source_file

	validates :file_data_source_file, presence: true
	validates_associated :file_data_source_file

	def as_json(options = {})
		super(options.merge(:include => :file_data_source_file))
	end
end
