class CreateDatasetAccessPermissions < ActiveRecord::Migration
	def change
		create_table :dataset_access_permissions do |t|
			t.belongs_to :dataset
			t.belongs_to :user

			t.string :level

			t.index [:dataset_id, :user_id], unique: true

			t.timestamps
		end
	end
end
