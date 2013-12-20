class Api::V0::SessionsController < ApplicationController
  # GET /api/v0/sessions/create
  def create
  	user = User.from_omniauth env['omniauth.auth']
  	session[:user_id] = user.id
  	redirect_to root_url, notice: "Logged in."
  end

  # GET /api/v0/sessions/destroy
  def destroy
  	session[:user_id] = nil
  	redirect_to root_url, notice: "Logged out."
  end

  # GET /api/v0/sessions/failure
  def failure
  	redirect_to root_url, notice: "Error."
  end
end
