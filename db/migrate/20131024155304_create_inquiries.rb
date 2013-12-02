class CreateInquiries < ActiveRecord::Migration
  def change
    create_table :inquiries do |t|
      t.belongs_to :dataset
      t.belongs_to :user

      t.string :name
      t.boolean :keep
      
      # search parameters
      t.string :query_text
      t.boolean :limit_hashtags
      t.boolean :limit_mentions
      t.boolean :limit_users
      t.boolean :sentiment_positive
      t.boolean :sentiment_negative
      t.boolean :sentiment_neutral
      t.date :start_date
      t.date :end_date
      t.boolean :mon
      t.boolean :tue
      t.boolean :wed
      t.boolean :thu
      t.boolean :fri
      t.boolean :sat
      t.boolean :sun
      t.boolean :only_geodata
      t.float :near_lat
      t.float :near_long
      t.float :within_distance
      t.string :within_units
      
      t.timestamps
    end
  end
end
