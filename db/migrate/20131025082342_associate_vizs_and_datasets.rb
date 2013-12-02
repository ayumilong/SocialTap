class AssociateVizsAndDatasets < ActiveRecord::Migration
  def change
    create_table :datasets_vizs do |t|
      t.belongs_to :viz
      t.belongs_to :dataset

      t.integer :order
      t.string :name
    end
  end
end
