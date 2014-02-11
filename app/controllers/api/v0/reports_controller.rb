class Api::V0::ReportsController < ApplicationController
  # GET /api/v0/reports
  # GET /api/v0/reports.json
  def index
    @reports = Report.all

    render json: @reports
  end

  # GET /api/v0/reports/1
  # GET /api/v0/reports/1.json
  def show
    @report = Report.find(params[:id])

    render json: @report
  end

  # POST /api/v0/reports
  # POST /api/v0/reports.json
  def create
    @report = Report.new(params[:report])

    if @report.save
      render json: @report, status: :created, location: @report
    else
      render json: @report.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/reports/1
  # PATCH/PUT /api/v0/reports/1.json
  def update
    @report = Report.find(params[:id])

    if @report.update(params[:report])
      head :no_content
    else
      render json: @report.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v0/reports/1
  # DELETE /api/v0/reports/1.json
  def destroy
    @report = Report.find(params[:id])
    @report.destroy

    head :no_content
  end
end
