class ConnectedAccount < ActiveRecord::Base

	belongs_to :user

	validates :provider, { presence: true }
	validates :uid, { presence: true }
	validates :username, { presence: true }
	validates :token, { presence: true }
	validates :secret, { presence: true }

end
