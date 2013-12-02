class Api::V0::DataSourcesController < ApplicationController

  # GET /api/v0/data_sources
  # GET /api/v0/data_sources.json
  def index
    @data_sources = DataSource.all

    if (params[:type])
      @data_sources = @data_sources.select { |ds| ds.type == (params[:type].capitalize + "DataSource") }
    end

    render json: @data_sources
  end

  # GET /api/v0/data_sources/1
  # GET /api/v0/data_sources/1.json
  def show
    @data_source = DataSource.find(params[:id])

    render json: @data_source
  end

  # POST /api/v0/data_sources
  # POST /api/v0/data_sources.json
  def create
    @data_source = DataSource.new(params[:data_source])

    success = @data_source.save rescue false
    if success
      render json: @data_source, status: :created
    else
      render json: @data_source.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/data_sources/1
  # DELETE /api/v0/data_sources/1.json
  def destroy
    @data_source = DataSource.find(params[:id])
    @data_source.destroy

    head :no_content
  end

end
