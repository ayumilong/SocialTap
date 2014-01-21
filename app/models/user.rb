class User < ActiveRecord::Base
	has_and_belongs_to_many :datasets
	has_many :inquiries

	has_one :identity

	validates :name, {
		presence: true
	}

	def self.from_omniauth(auth)
		if auth[:provider] == 'identity'
			identity = Identity.find_by_id(auth[:uid])
		else
			identity = ProviderIdentity.where(provider: auth[:provider], uid: auth[:uid]).limit(1).first
		end
		identity.user || self.create_from_omniauth(auth)
	end

	def self.create_from_omniauth(auth)
		create do |user|
			user.name = auth[:info][:name]
			if auth[:provider] == 'identity'
				identity = Identity.find_by_id(auth[:uid])
				identity.user = user
				identity.save
			end
		end
	end

end
