class CreateDataMappings < ActiveRecord::Migration
  def change
    create_table :data_mappings do |t|
      t.belongs_to :file_dataset

      t.string :type
      t.string :options

      t.timestamps
    end
  end
end
