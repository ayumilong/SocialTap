require 'pp'
class Api::V0::DatasetsController < ApplicationController
  # GET /api/v0/datasets
  # GET /api/v0/datasets.json
  def index
    @datasets = Dataset.all

    render json: @datasets
  end

  # GET /api/v0/datasets/1
  # GET /api/v0/datasets/1.json
  def show
    @dataset = Dataset.find(params[:id])

    render json: @dataset
  end

  # GET /api/v0/datasets/1/imports
  # GET /api/v0/datasets/1/imports.json
  def imports
    @dataset = Dataset.find(params[:id])
    # Return imports in reverse chronological order
    render json: @dataset.import_operations.sort_by(&:time_started).reverse.as_json(methods: [:data_source, :failed?, :in_progress?])
  end

  # POST /api/v0/datasets
  # POST /api/v0/datasets.json
  def create
    @dataset = Dataset.new(params[:dataset])

    if @dataset.save
      render json: @dataset, status: :created
    else
      render json: @dataset.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/datasets/1
  # PATCH/PUT /api/v0/datasets/1.json
  def update
    @dataset = Dataset.find(params[:id])

    if @dataset.update(params[:dataset])
      head :no_content
    else
      render json: @dataset.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/datasets/1
  # DELETE /api/v0/datasets/1.json
  def destroy
    @dataset = Dataset.find(params[:id])
    @dataset.destroy

    head :no_content
  end

  # POST /api/v0/inquiries/1/search
  # POST /api/v0/inquiries/1/search.json
  def search
    @dataset = Dataset.find(params[:id])
    results = @dataset.search(params[:elasticsearch])
    #pp results["facets"]
    render json: results
  end
end
