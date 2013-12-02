class CreateDataMappings < ActiveRecord::Migration
  def change
    create_table :data_mappings do |t|
      t.belongs_to :file_data_source

      t.string :type

      t.timestamps
    end
  end
end
