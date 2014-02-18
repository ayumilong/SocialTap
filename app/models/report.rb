class Report < ActiveRecord::Base

	belongs_to :user
	belongs_to :inquiry

	accepts_nested_attributes_for :inquiry

	validates_inclusion_of :status, in: ['Pending', 'Generating', 'Ready', 'Failed']

end
