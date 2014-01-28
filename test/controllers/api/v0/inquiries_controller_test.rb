require 'test_helper'

class Api::V0::InquiriesControllerTest < ActionController::TestCase
  setup do
    @inquiry = inquiries(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:inquiries)
  end

  test "should create inquiry" do
    assert_difference('Inquiry.count') do
      post :create, inquiry: {  }
    end

    assert_response 201
  end

  test "should show inquiry" do
    get :show, id: @inquiry
    assert_response :success
  end

  test "should update inquiry" do
    put :update, id: @inquiry, inquiry: {  }
    assert_response 204
  end

  test "should destroy inquiry" do
    assert_difference('Inquiry.count', -1) do
      delete :destroy, id: @inquiry
    end

    assert_response 204
  end
end
