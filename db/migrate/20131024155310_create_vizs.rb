class CreateVizs < ActiveRecord::Migration
  def change
    create_table :vizs do |t|
      t.string :name
      t.string :module_name

      t.timestamps
    end
  end
end
