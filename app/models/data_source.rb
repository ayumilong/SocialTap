class DataSource < ActiveRecord::Base
	has_many :import_operations, dependent: :destroy
	has_many :datasets, through: :import_operations

	def as_json(options = {})
		super(options.merge({:methods => :type}))
	end
end
