class AssociateUsersAndDatasets < ActiveRecord::Migration
  def change
    create_table :datasets_users do |t|
      t.belongs_to :user
      t.belongs_to :dataset

      t.boolean :is_owner
    end
  end
end
