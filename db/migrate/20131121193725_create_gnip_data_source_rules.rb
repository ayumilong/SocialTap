class CreateGnipDataSourceRules < ActiveRecord::Migration
  def change
    create_table :gnip_data_source_rules do |t|
      t.belongs_to :gnip_data_source
      t.string :value

      t.timestamps
    end
  end
end
