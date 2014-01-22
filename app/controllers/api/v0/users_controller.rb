class Api::V0::UsersController < ApplicationController

  def me
    if signed_in?
      render json: current_user
    else
      render json: nil, status: :unauthorized
    end
  end

  # GET /api/v0/users
  # GET /api/v0/users.json
  def index
    @users = User.all

    render json: @users
  end

  # GET /api/v0/users/1
  # GET /api/v0/users/1.json
  def show
    @user = User.find(params[:id])

    render json: @user
  end

  # POST /api/v0/users
  # POST /api/v0/users.json
  def create
    @user = User.new(params[:user])

    if @user.save
      render json: @user, status: :created, location: [:api, :v0, @user]
    else
      render json: @user.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v0/users/1
  # PATCH/PUT /api/v0/users/1.json
  def update
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
    @user = User.find(params[:id])
    @user.destroy

    head :no_content
  end
end
