class Api::V0::UsersController < ApplicationController

	before_action :require_login

	def me
		render json: current_user.as_json({
			only: [:id, :name],
			include: [
				{ identity: { only: [:email, :name] } },
				{ provider_identity: { only: [:provider, :username] } }
			]
		})
	end

	# GET /api/v0/users
	# GET /api/v0/users.json
	def index
		@users = User.all

		render json: @users.as_json(only: [:id, :name])
	end

	# PATCH/PUT /api/v0/users/1
	# PATCH/PUT /api/v0/users/1.json
	def update
		unless params[:id] == current_user.id
			render json: { error: "You are not authorized to perform this action" }, status: :forbidden
		end

		@user = User.find(params[:id])

		if @user.update(params[:user])
			head :no_content
		else
			render json: @user.errors, status: :unprocessable_entity
		end
	end

	# DELETE /api/v0/users/1
	# DELETE /api/v0/users/1.json
	def destroy
		unless params[:id] == current_user.id
			render json: { error: "You are not authorized to perform this action" }, status: :forbidden
		end

		@user = User.find(params[:id])
		@user.destroy

		head :no_content
	end

end
