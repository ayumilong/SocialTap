class CreateDataSources < ActiveRecord::Migration
  def change
    create_table :data_sources do |t|

      t.string :type

      t.timestamps
    end
  end
end
