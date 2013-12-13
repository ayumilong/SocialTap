class CreateDatasets < ActiveRecord::Migration
  def change
    create_table :datasets do |t|
      t.string :name
      t.text :description
      t.string :type
      t.string :source
      t.timestamps
    end
  end
end
