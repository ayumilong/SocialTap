class Identity < OmniAuth::Identity::Models::ActiveRecord

	belongs_to :user

	validates :email, {
		presence:   true,
		format:     { with: /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\Z/i },
		uniqueness: { case_sensitive: false }
	}

	validates :name, { presence: true }

	validates :password, { length: { minimum: 6 } }

	before_save { self.email = email.downcase }

end
