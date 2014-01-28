# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140122160557) do

  create_table "data_mappings", force: true do |t|
    t.integer  "file_dataset_id"
    t.string   "type"
    t.string   "options"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "datasets", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "type"
    t.string   "source"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "datasets_users", force: true do |t|
    t.integer "user_id"
    t.integer "dataset_id"
    t.boolean "is_owner"
  end

  create_table "identities", force: true do |t|
    t.integer  "user_id"
    t.string   "email"
    t.string   "name"
    t.string   "password_digest"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "identities", ["email"], name: "index_identities_on_email", unique: true
  add_index "identities", ["user_id"], name: "index_identities_on_user_id"

  create_table "import_operations", force: true do |t|
    t.integer  "dataset_id"
    t.datetime "time_started"
    t.datetime "time_stopped"
    t.string   "error_message"
    t.integer  "pid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "inquiries", force: true do |t|
    t.integer  "dataset_id"
    t.integer  "user_id"
    t.string   "name"
    t.boolean  "keep"
    t.string   "query_text"
    t.boolean  "limit_hashtags"
    t.boolean  "limit_mentions"
    t.boolean  "limit_users"
    t.boolean  "sentiment_positive"
    t.boolean  "sentiment_negative"
    t.boolean  "sentiment_neutral"
    t.date     "start_date"
    t.date     "end_date"
    t.boolean  "mon"
    t.boolean  "tue"
    t.boolean  "wed"
    t.boolean  "thu"
    t.boolean  "fri"
    t.boolean  "sat"
    t.boolean  "sun"
    t.boolean  "only_geodata"
    t.float    "near_lat"
    t.float    "near_long"
    t.float    "within_distance"
    t.string   "within_units"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "provider_identities", force: true do |t|
    t.integer  "user_id"
    t.string   "provider"
    t.string   "uid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "provider_identities", ["provider", "uid"], name: "index_provider_identities_on_provider_and_uid"
  add_index "provider_identities", ["user_id"], name: "index_provider_identities_on_user_id"

  create_table "users", force: true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
