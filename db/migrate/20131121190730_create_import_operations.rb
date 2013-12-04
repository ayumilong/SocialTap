class CreateImportOperations < ActiveRecord::Migration
  def change
    create_table :import_operations do |t|
      t.belongs_to :dataset
      t.belongs_to :data_source

      t.timestamp :time_started
      t.timestamp :time_stopped
      t.string :stop_error_message
      t.integer :pid
      t.integer :activities_imported

      t.timestamps
    end
  end
end
