class Report < ActiveRecord::Base

	belongs_to :user
	belongs_to :inquiry

	accepts_nested_attributes_for :inquiry

end
