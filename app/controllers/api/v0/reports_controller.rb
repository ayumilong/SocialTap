class Api::V0::ReportsController < ApplicationController

	before_action :require_login

	# GET /api/v0/reports
	# GET /api/v0/reports.json
	def index
		@reports = current_user.reports

		render json: @reports.order(created_at: :desc).as_json(:include => [:dataset], :methods => [:output_path])
	end

	# GET /api/v0/reports/1
	# GET /api/v0/reports/1.json
	def show
		@report = current_user.reports.find_by_id(params[:id])

		render json: @report.as_json(:include => [:dataset], :methods => [:output_path])
	end

	# POST /api/v0/reports
	# POST /api/v0/reports.json
	def create

		# By default, Rails converts empty arrays in the JSON request to nil.
		# This uses ActiveSupport::JSON#decode to undo that.
		if request.format.json?
			request.body.rewind
			request_body = request.body.read
			unless request_body.blank?
				request_body = ActiveSupport::JSON.decode(request_body)
				params[:report][:inquiry_definition].merge!(request_body['report']['inquiry_definition'])
			end
		end

		@report = Report.new(params[:report])
		@report.user = current_user

		if @report.save
			render json: @report.as_json(:include => [:dataset], :methods => [:output_path]), status: :created, location: [:api, :v0, @report]
		else
			render json: @report.errors, status: :unprocessable_entity
		end
	end

	# PATCH/PUT /api/v0/reports/1
	# PATCH/PUT /api/v0/reports/1.json
	def update
		@report = current_user.reports.find_by_id(params[:id])

		if @report.update(params[:report])
			head :no_content
		else
			render json: @report.errors, status: :unprocessable_entity
		end
	end

	# DELETE /api/v0/reports/1
	# DELETE /api/v0/reports/1.json
	def destroy
		@report = current_user.reports.find_by_id(params[:id])
		@report.destroy

		head :no_content
	end
end
