class DatasetAccessPermission < ActiveRecord::Base

	# @!attribute dataset
	#   @return [Dataset]
	belongs_to :dataset
	validates :dataset, presence: true

	# @!attribute user
	#   @return [User]
	belongs_to :user
	validates :user, presence: true

	# @!attribute level
	#   The level of access to the dataset granted to the user.
	#   @return [String] 'read' or 'admin'
	validates :level, { presence: true, inclusion: ["read", "admin"] }

end
