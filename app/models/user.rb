class User < ActiveRecord::Base
  has_and_belongs_to_many :datasets
  has_many :inquiries
  has_secure_password

  # OmniAuth authentication methods
  has_one :auth_identity
  has_one :auth_twitter
  
  validates :password, length: { minimum: 6 }
  validates :name, presence: true, length: { maximum: 64 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
  validates :email, presence:   true,
                    format:     { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  
  before_save { self.email = email.downcase }
  
end
