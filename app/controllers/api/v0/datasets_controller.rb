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

    render json: @dataset.as_json(:methods => [:import_in_progress, :type], :include => { :import_operations => { :methods => [:in_progress, :failed] } } )
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

  # DELETE /api/v0/datasets/1
  # DELETE /api/v0/datasets/1.json
  def destroy
    @dataset = Dataset.find(params[:id])
    @dataset.destroy

    head :no_content
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
    @dataset = Dataset.find_by_id(params[:id])

    if @dataset.nil?
      render nothing: true, status: :not_found
    else
      results = @dataset.search(params[:elasticsearch])
      render json: results
    end
  end
end
