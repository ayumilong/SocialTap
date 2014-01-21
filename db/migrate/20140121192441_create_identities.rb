class CreateIdentities < ActiveRecord::Migration
	def change
		create_table :identities do |t|
			t.integer :user_id
			t.string :email
			t.string :name
			t.string :password_digest

			t.timestamps

			t.index :email, { :unique => true }
			t.index :user_id
		end
	end
end
