class Api::V0::ImportOperationsController < ApplicationController
  # GET /api/v0/import_operations
  # GET /api/v0/import_operations.json
  def index
    @import_operations = ImportOperation.all

    render json: @import_operations
  end

  # GET /api/v0/import_operations/1
  # GET /api/v0/import_operations/1.json
  def show
    @import_operation = ImportOperation.find(params[:id])

    render json: @import_operation
  end

  # GET /api/v0/import_operations/1/stop
  # GET /api/v0/import_operations/1/stop.json
  def stop
    @import_operation = ImportOperation.find(params[:id])
    render json: @import_operation.stop!
  end

  # GET /api/v0/import_operations/1/stop
  # GET /api/v0/import_operations/1/stop.json
  def restart
    @import_operation = ImportOperation.find(params[:id])
    render json: @import_operation.restart
  end

  # POST /api/v0/import_operations
  # POST /api/v0/import_operations.json
  def create
    @import_operation = ImportOperation.new(params[:import_operation])

    if @import_operation.save
      render json: @import_operation, status: :created
    else
      render json: @import_operation.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/import_operations/1
  # PATCH/PUT /api/v0/import_operations/1.json
  def update
    @import_operation = ImportOperation.find(params[:id])

    if @import_operation.update(params[:import_operation])
      head :no_content
    else
      render json: @import_operation.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/import_operations/1
  # DELETE /api/v0/import_operations/1.json
  def destroy
    @import_operation = ImportOperation.find(params[:id])
    @import_operation.destroy

    head :no_content
  end

end
