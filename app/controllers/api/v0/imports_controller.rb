class Api::V0::ImportsController < ApplicationController

	before_filter :load_dataset

	# POST /api/v0/datasets/1/imports
	# POST /api/v0/datasets/1/imports.json
	def create

		# TODO: Prevent multiple simultaneous imports?

		@import_op = ImportOperation.new(import_params)
		@import_op.dataset = @dataset

		if  @import_op.save
			begin
				import_op.enqueue
				head :created
			rescue StandardError => e
				import_op.destroy
				render json: { error: e.message }, status: :internal_server_error
			end
		else
			render json: @import_op.errors, status: :bad_request
		end
	end

	# DELETE /api/v0/datasets/1/imports/1
	# DELETE /api/v0/datasets/1/imports/1.json
	def destroy
		@import_op = @dataset.import_operations.find_by_id(params[:id])
		begin
			@import_op.cancel!
			head :no_content
		rescue StandardError => e
			render json: { error: e.message }, status: :internal_server_error
		end
	end

private

	def import_params
		params.require(:import).permit(:source_type, :source_spec)
	end

	def load_dataset
		@dataset = Dataset.find_by_id(params[:dataset_id])
		if @dataset.nil?
			render json: { error: "Dataset not found" }, status: :not_found
		end
	end

end
