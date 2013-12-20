class User < ActiveRecord::Base
  has_and_belongs_to_many :datasets
  has_many :inquiries

  # OmniAuth authentication method containing password/email login info
  has_one :auth_identity
  
  validates :name, presence: true, length: { maximum: 64 }
  
  def self.from_omniauth auth
    where(auth.slice("provider", "uid")).first || create_from_omniauth(auth)
  end

  def self.create_from_omniauth auth
    create! do |user|
      user.provider = auth["provider"]
      user.uid = auth["uid"]
      user.name = auth["info"]["nickname"]
    end
  end

end
