# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

puts "Seeding..."

Dataset.create(
  name: "The South",
  description: "Geocoded tweets about American southerners and the south",
)

User.create(
  name: "Test User",
  email: "guirl@clemson.edu",
  password_digest: ""
)

Inquiry.create(
  name: "Southern food, hospitality, and accents",
  dataset_id: 1,
  user_id: 1,
  keep: true,
  query_text: "food hospitality accent",
  limit_hashtags: false,
  limit_mentions: false,
  limit_users: false,
  sentiment_positive: false,
  sentiment_negative: false,
  sentiment_neutral: false,
  start_date: "",
  end_date: "",
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
  sun: false,
  only_geodata: false,
  near_lat: 0,
  near_long: 0,
  within_distance: 0,
  within_units: "miles"
)

puts "Complete!"
