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

ActiveRecord::Schema.define(version: 20131202154100) do

  create_table "data_mappings", force: true do |t|
    t.integer  "file_data_source_id"
    t.string   "type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "data_sources", force: true do |t|
    t.string   "type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "datasets", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "es_index"
    t.string   "es_mapping"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "datasets_users", force: true do |t|
    t.integer "user_id"
    t.integer "dataset_id"
    t.boolean "is_owner"
  end

  create_table "datasets_vizs", force: true do |t|
    t.integer "viz_id"
    t.integer "dataset_id"
    t.integer "order"
    t.string  "name"
  end

  create_table "file_data_source_files", force: true do |t|
    t.integer  "file_data_source_id"
    t.string   "path"
    t.string   "format"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "gnip_data_source_rules", force: true do |t|
    t.integer  "gnip_data_source_id"
    t.string   "value"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "import_operations", force: true do |t|
    t.integer  "dataset_id"
    t.integer  "data_source_id"
    t.datetime "time_started"
    t.datetime "time_stopped"
    t.string   "stop_error_message"
    t.integer  "pid"
    t.integer  "activities_imported"
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

  create_table "users", force: true do |t|
    t.string   "name"
    t.string   "email"
    t.string   "password_digest"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "vizs", force: true do |t|
    t.string   "name"
    t.string   "module_name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
