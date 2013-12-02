require 'test_helper'

class VizsControllerTest < ActionController::TestCase
  setup do
    @viz = vizs(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:vizs)
  end

  test "should create viz" do
    assert_difference('Viz.count') do
      post :create, viz: {  }
    end

    assert_response 201
  end

  test "should show viz" do
    get :show, id: @viz
    assert_response :success
  end

  test "should update viz" do
    put :update, id: @viz, viz: {  }
    assert_response 204
  end

  test "should destroy viz" do
    assert_difference('Viz.count', -1) do
      delete :destroy, id: @viz
    end

    assert_response 204
  end
end
