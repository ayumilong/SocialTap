class Api::V0::InquiriesController < ApplicationController

	before_action :require_user
	def require_user
		unless signed_in?
			render json: { error: "You must login to perform this action" }, status: :unauthorized
		end
	end

	# GET /api/v0/inquiries
	# GET /api/v0/inquiries.json
	def index
		@inquiries = current_user.inquiries
		if params[:dataset_id]
			@inquiries = @inquiries.where({dataset_id: params[:dataset_id]}).order(updated_at: :desc)
		end
		render json: @inquiries.order(updated_at: :desc)
	end

	# GET /api/v0/inquiries/1
	# GET /api/v0/inquiries/1.json
	def show
		@inquiry = current_user.inquiries.find_by_id(params[:id])
		render json: @inquiry
	end

	# POST /api/v0/inquiries
	# POST /api/v0/inquiries.json
	def create

		# By default, Rails converts empty arrays in the JSON request to nil.
		# This uses ActiveSupport::JSON#decode to undo that.
		if request.format.json?
			request.body.rewind
			request_body = request.body.read
			params.merge!(ActiveSupport::JSON.decode(request_body)) unless request_body.blank?
		end

		@inquiry = Inquiry.new(params[:inquiry])
		@inquiry.user = current_user

		if @inquiry.save
			render json: @inquiry, status: :created, location: [:api, :v0, @inquiry]
		else
			render json: @inquiry.errors, status: :unprocessable_entity
		end
	end

	# PATCH/PUT /api/v0/inquiries/1
	# PATCH/PUT /api/v0/inquiries/1.json
	def update
		@inquiry = current_user.inquiries.find_by_id(params[:id])
		if @inquiry.update(params[:inquiry])
			head :no_content
		else
			render json: @inquiry.errors, status: :unprocessable_entity
		end
	end

	# DELETE /api/v0/inquiries/1
	# DELETE /api/v0/inquiries/1.json
	def destroy
		@inquiry = current_user.inquiries.find_by_id(params[:id])
		@inquiry.destroy
		head :no_content
	end

end
