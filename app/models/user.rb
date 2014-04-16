class User < ActiveRecord::Base
	has_and_belongs_to_many :datasets
	has_many :inquiries, dependent: :destroy

	has_one :identity, dependent: :destroy
	has_many :connected_accounts, dependent: :destroy

	has_many :reports, dependent: :destroy

	validates :name, {
		presence: true
	}

end
