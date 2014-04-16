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

ActiveRecord::Schema.define(version: 20140210183708) do

  create_table "connected_accounts", force: true do |t|
    t.integer  "user_id"
    t.string   "provider"
    t.string   "uid"
    t.string   "username"
    t.string   "token"
    t.string   "secret"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "connected_accounts", ["provider", "uid"], name: "index_connected_accounts_on_provider_and_uid"
  add_index "connected_accounts", ["user_id"], name: "index_connected_accounts_on_user_id"

  create_table "datasets", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.string   "es_index"
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
    t.string   "source_type"
    t.text     "source_spec"
    t.string   "from_format"
    t.string   "to_format"
    t.datetime "time_started"
    t.datetime "time_stopped"
    t.boolean  "aborted"
    t.string   "error_message"
    t.string   "worker_hostname"
    t.integer  "worker_pid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "inquiries", force: true do |t|
    t.integer  "dataset_id"
    t.integer  "user_id"
    t.string   "description"
    t.boolean  "keep",        default: false
    t.text     "definition"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "reports", force: true do |t|
    t.integer  "dataset_id"
    t.integer  "user_id"
    t.text     "inquiry_definition"
    t.string   "status",             default: "Pending"
    t.integer  "worker_pid"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "users", force: true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
