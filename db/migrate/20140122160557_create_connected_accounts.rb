class CreateConnectedAccounts < ActiveRecord::Migration
	def change
		create_table :connected_accounts do |t|
			t.belongs_to :user
			t.string :provider
			t.string :uid

			t.string :username
			t.string :token
			t.string :secret

			t.timestamps

			t.index [:provider, :uid]
			t.index :user_id
		end
	end
end
