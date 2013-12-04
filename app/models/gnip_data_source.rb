class GnipDataSource < DataSource
	has_one :rule, { class_name: 'GnipDataSourceRule',
					 foreign_key: 'gnip_data_source_id',
					 inverse_of: :gnip_data_source,
					 dependent: :destroy }

	accepts_nested_attributes_for :rule

	validates :rule, presence: true
	validates_associated :rule

	def log_file_path
		if id.nil?
			nil
		else
			Rails.root.join("log", "data_source_#{id}.gnip.log")
		end
	end

	# Ensure the log file path can be written to
	validate :validate_log_file_path, if: "!id.nil?"
	def validate_log_file_path
		begin
			f = File.open(log_file_path, "w")
			f.close
		rescue
			errors[:log_file_path] << ("Unable to write to " + log_file_path)
		end
	end

	def as_json(options = {})
		super(options.merge(:include => :rule))
	end
end
