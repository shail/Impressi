class ApplicationController < ActionController::Base
  protect_from_forgery
  
  helper_method :current_or_guest_user, :guest_user
  
  def current_or_guest_user
    current_user || guest_user
  end
   
  def guest_user
    session[:guest_user_id] ||= create_guest_user.id
    User.find(session[:guest_user_id])
  end

  def guest_user?
    session[:guest_user_id]
  end
  
  def move_decks_from_guest_user
    false if session[:guest_user_id] 
    decks = Deck.find_by_user_id(session[:guest_user_id])
    decks.user_id = current_or_guest_user.id
    decks.save
  end

  private

  def create_guest_user
    u = User.create(:email => "guest_#{Time.now.to_i}#{rand(99)}@email_address.com",
                    :password => Devise.friendly_token[0,20])
  end
end
