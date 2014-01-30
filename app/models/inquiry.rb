class Inquiry < ActiveRecord::Base
	belongs_to :user
	belongs_to :dataset

	validates :user, presence: true
	validates :dataset, presence: true
	validates :definition, presence: true

	serialize :definition, JSON

	# Remove all unsaved inquiries that aren't in the 5 most recently updated
	before_create :limit_recent_inquiries
	def limit_recent_inquiries
		existing_inquiries = Inquiry.where(user: self.user).order(updated_at: :desc)
		if existing_inquiries.count > 4
			existing_inquiries.slice(4..-1).map { |inq| inq.destroy unless inq.saved? }
		end
	end
end
