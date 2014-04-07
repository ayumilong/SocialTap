class CreateImportOperations < ActiveRecord::Migration
  def change
    create_table :import_operations do |t|
      t.belongs_to :dataset

      t.string :source_type
      t.text :source_spec

      t.timestamp :time_started
      t.timestamp :time_stopped
      t.boolean :aborted
      t.string :error_message

      t.string :worker_hostname
      t.integer :worker_pid

      t.timestamps
    end
  end
end
