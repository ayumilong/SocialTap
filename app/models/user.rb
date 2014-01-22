class User < ActiveRecord::Base
	has_and_belongs_to_many :datasets
	has_many :inquiries

	has_many :identities
	has_many :provider_identities

	validates :name, {
		presence: true
	}

	def merge(other_user)
		other_user.identities.each do |id|
			id.user = self
			id.save
		end

		other_user.provider_identities.each do |id|
			id.user = self
			id.save
		end

		other_user.destroy
	end

end
