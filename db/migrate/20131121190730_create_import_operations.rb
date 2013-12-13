class CreateImportOperations < ActiveRecord::Migration
  def change
    create_table :import_operations do |t|
      t.belongs_to :dataset

      t.timestamp :time_started
      t.timestamp :time_stopped
      t.string :error_message
      t.integer :pid
      t.integer :items_imported

      t.timestamps
    end
  end
end
