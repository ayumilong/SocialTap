class User < ActiveRecord::Base

	# @!attribute dataset_access_permissions
	#   The permissions this user has for access to datasets.
	#   @return [ActiveRecord::Associations::CollectionProxy]
	has_many :dataset_access_permissions, dependent: :destroy

	# @!attribute datasets
	#   The datasets this user has access to.
	#   @return [ActiveRecord::Associations::CollectionProxy]
	has_many :datasets, through: :dataset_access_permissions

	has_many :inquiries, dependent: :destroy

	# @!attribute identity
	#   This user's identity for signing into the application.
	#   @return [Identity]
	has_one :identity, dependent: :destroy

	# @!attribute connected_accounts
	#   External OAuth accounts connected to this user.
	#   @return [ActiveRecord::Associations::CollectionProxy]
	has_many :connected_accounts, dependent: :destroy

	has_many :reports, dependent: :destroy

	# Whether or not this user has read access to the given dataset.
	# @param [Dataset] dataset
	# @return [Boolean]
	def can_read_dataset(dataset)
		!dataset_access_permissions.where(dataset_id: dataset.id).empty?
	end

	# Whether or not this user has administrative access to the given dataset.
	# @param [Dataset] dataset
	# @return [Boolean]
	def can_alter_dataset(dataset)
		!dataset_access_permissions.where(dataset_id: dataset.id, level: 'admin').empty?
	end

end
