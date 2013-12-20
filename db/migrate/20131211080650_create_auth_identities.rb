class CreateAuthIdentities < ActiveRecord::Migration
  def change
    create_table :auth_identities do |t|
      t.string :email
      t.string :name
      t.string :password_digest

      t.timestamps
    end
  end
end
