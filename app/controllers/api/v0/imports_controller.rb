class Api::V0::ImportsController < ApplicationController

	before_action :require_login
	before_action :load_dataset, only: [:create, :destroy]
	before_action :require_admin!, only: [:create, :destroy]

	# POST /api/v0/datasets/1/imports
	# POST /api/v0/datasets/1/imports.json
	def create

		@import_op = ImportOperation.new(import_params)
		@import_op.dataset = @dataset
		@import_op.started_by = current_user

		if @import_op.save
			begin
				@import_op.enqueue
				render json: @import_op, status: :created
			rescue StandardError => e
				@import_op.destroy
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

		if @import_op.status == :pending
			@import_op.destroy
			head :no_content
		elsif @import_op.status == :in_progress
			begin
				@import_op.cancel!
				@import_op.stopped_by = current_user
				@import_op.save!
				head :no_content
			rescue StandardError => e
				render json: { error: e.message }, status: :internal_server_error
			end
		else
			render json: { error: "Cannot delete completed import" }, status: :bad_request
		end
	end

	# GET /api/v0/imports/format_conversions
	# GET /api/v0/imports/format_conversions.json
	def format_conversions
		render json: Import::Converter.available_conversions
	end

private

	def import_params
		# Permit arbitrary JSON for source_spec.
		spec_keys = get_nested_keys(params[:import_operation][:source_spec])
		params.require(:import_operation).permit(:source_type, :from_format, :to_format, { :source_spec => spec_keys })

	end

	def load_dataset
		@dataset = Dataset.find_by_id(params[:dataset_id])
		if @dataset.nil?
			render json: { error: "Dataset not found" }, status: :not_found
		end
	end

	def require_admin!
		unless current_user.can_alter_dataset(@dataset)
			render json: { error: "You are not authorized to perform that action" }, status: :forbidden
		end
	end

end

def get_nested_keys(obj)
	obj.keys.map do |key|
		val = obj[key]
		if val.is_a? Hash
			{ key => get_keys(val) }
		elsif val.is_a? Array
			{ key => [] }
		else
			key
		end
	end
end
