class CreateFileDataSourceFiles < ActiveRecord::Migration
  def change
    create_table :file_data_source_files do |t|
      t.belongs_to :file_data_source
      t.string :path
      t.string :format

      t.timestamps
    end
  end
end
