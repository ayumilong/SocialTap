class Api::V0::DatasetsController < ApplicationController

	before_action :require_login
	before_action :load_dataset, only: [:show, :search, :destroy]
	before_action :require_access!, only: [:show, :search]
	before_action :require_admin!, only: [:destroy]

	# GET /api/v0/datasets
	# GET /api/v0/datasets.json
	def index
		@datasets = current_user.datasets
		render json: @datasets
	end

	# GET /api/v0/datasets/1
	# GET /api/v0/datasets/1.json
	def show
		render json: @dataset.as_json(:include => { :import_operations => { :methods => [:status, :convert] } } )
	end

	# POST /api/v0/datasets
	# POST /api/v0/datasets.json
	def create

		@dataset = Dataset.new(dataset_params)
		@permission = DatasetAccessPermission.new(dataset: @dataset, user: @current_user, level: 'admin')

		begin
			@dataset.transaction do
				@dataset.save!
				@permission.save!
			end
			render json: @dataset, status: :created
		rescue ActiveRecord::RecordInvalid
			render json: @dataset.errors, status: :unprocessable_entity
		end
	end

	# DELETE /api/v0/datasets/1
	# DELETE /api/v0/datasets/1.json
	def destroy
		@dataset.destroy
		head :no_content
	end

	# POST /api/v0/datasets/1/search
	# POST /api/v0/datasets/1/search.json
	def search
		results = @dataset.search(params[:elasticsearch])
		render json: results
	end

private

	def dataset_params
		params.require(:dataset).permit(:name, :description)
	end

	def load_dataset
		@dataset = Dataset.find_by_id(params[:id])
		if @dataset.nil?
			render nothing: true, status: :not_found
		end
	end

	def require_access!
		unless current_user.can_read_dataset(@dataset)
			render json: { error: "You are not authorized to perform this action" }, status: :forbidden
		end
	end

	def require_admin!
		unless current_user.can_alter_dataset(@dataset)
			render json: { error: "You are not authorized to perform this action" }, status: :forbidden
		end
	end

end
