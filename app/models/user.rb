class User < ActiveRecord::Base
	has_and_belongs_to_many :datasets
	has_many :inquiries

	has_one :identity
	has_many :provider_identities

	validates :name, {
		presence: true
	}

	def self.from_omniauth(auth)
		if auth[:provider] == 'identity'
			identity = Identity.find_by_id(auth[:uid])
		else
			identity = ProviderIdentity.where(provider: auth[:provider], uid: auth[:uid]).limit(1).first
		end
		(identity && identity.user) || self.create_from_omniauth(auth)
	end

	def self.create_from_omniauth(auth)
		user = User.new
		user.name = auth[:info][:name]
		user.save

		if auth[:provider] == 'identity'
			identity = Identity.find_by_id(auth[:uid])
		else
			identity = ProviderIdentity.create(provider: auth[:provider], uid: auth[:uid])
		end
		identity.user = user
		identity.save

		user
	end

end
