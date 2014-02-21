class CreateReports < ActiveRecord::Migration
	def change
		create_table :reports do |t|
			t.belongs_to :dataset
			t.belongs_to :user

			t.text :inquiry_definition

			t.string :status, default: 'Pending'
			t.integer :worker_pid

			t.timestamps
		end
	end
end
