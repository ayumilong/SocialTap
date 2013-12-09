class FileDataSource < DataSource
	has_one :file, { class_name: 'FileDataSourceFile',
					 foreign_key: 'file_data_source_id',
					 inverse_of: :file_data_source,
					 dependent: :destroy }
	has_one :data_mapping

	accepts_nested_attributes_for :data_mapping
	accepts_nested_attributes_for :file

	validates :file, presence: true
	validates_associated :file

	validates :data_mapping, presence: true

	def as_json(options = {})
		super(options.merge(:include => :file))
	end
end
