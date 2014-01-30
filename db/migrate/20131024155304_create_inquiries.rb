class CreateInquiries < ActiveRecord::Migration
  def change
    create_table :inquiries do |t|
      t.belongs_to :dataset
      t.belongs_to :user

      t.string :description
      t.boolean :saved, default: false

      t.text :definition

      t.timestamps
    end
  end
end
