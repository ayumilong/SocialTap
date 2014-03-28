class CreateDatasets < ActiveRecord::Migration
  def change
    create_table :datasets do |t|
      t.string :name
      t.text :description

      t.string :es_index
      t.string :es_type

      t.timestamps
    end
  end
end
