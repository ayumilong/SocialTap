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

  # POST /api/v0/datasets
  # POST /api/v0/datasets.json
  def create

    if params[:dataset][:type] == 'FileDataset'
      params[:dataset][:source].gsub!(/\.\.\/?/, '')
    end

    @dataset = Dataset.new(params[:dataset])

    if @dataset.save
      render json: @dataset, status: :created
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

  # GET /api/v0/datasets/1/imports
  # GET /api/v0/datasets/1/imports.json
  def imports
    @dataset = Dataset.find(params[:id])
    # Return imports in reverse chronological order
    render json: @dataset.import_operations.sort_by(&:time_started).reverse.as_json(methods: [:data_source, :failed?, :in_progress?])
  end

  # GET /api/v0/datasets/1/start_import
  # GET /api/v0/datasets/1/start_import.json
  def start_import
    @dataset = Dataset.find(params[:id])
    render json: @dataset.start_import
  end

  # GET /api/v0/datasets/1/stop_import
  # GET /api/v0/datasets/1/stop_import.json
  def stop_import
    @dataset = Dataset.find(params[:id])
    render json: @dataset.stop_import
  end

  # POST /api/v0/inquiries/1/search
  # POST /api/v0/inquiries/1/search.json
  def search
    @dataset = Dataset.find(params[:id])
    results = @dataset.search(params[:elasticsearch])
    render json: results
  end
end
