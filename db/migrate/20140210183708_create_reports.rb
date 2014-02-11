class CreateReports < ActiveRecord::Migration
	def change
		create_table :reports do |t|
			t.belongs_to :user
			t.belongs_to :inquiry

			t.integer :worker_pid
			t.boolean :ready, default: false

			t.timestamps
		end
	end
end
