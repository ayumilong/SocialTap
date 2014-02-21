require 'test_helper'

class Api::V0::ReportsControllerTest < ActionController::TestCase
  setup do
    @api_v0_report = api_v0_reports(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:api_v0_reports)
  end

  test "should create api_v0_report" do
    assert_difference('Api::V0::Report.count') do
      post :create, api_v0_report: {  }
    end

    assert_response 201
  end

  test "should show api_v0_report" do
    get :show, id: @api_v0_report
    assert_response :success
  end

  test "should update api_v0_report" do
    put :update, id: @api_v0_report, api_v0_report: {  }
    assert_response 204
  end

  test "should destroy api_v0_report" do
    assert_difference('Api::V0::Report.count', -1) do
      delete :destroy, id: @api_v0_report
    end

    assert_response 204
  end
end
