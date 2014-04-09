module Import
module Converter

class TwitterToActivityStream

	# Convert a Tweet from the Twitter streaming API to a Gnip format activity stream
	# @param [Hash] tweet
	# @return [Hash]
	def convert(tweet)

		date_format = "%Y-%m-%dT%H:%M:%S.%LZ"

		activity = {
			id: "tag:search.twitter.com,2005:#{tweet['id']}",
			objectType: "activity",
			actor: {
				objectType: "person",
				id: "id:twitter.com:#{tweet['user']['id']}",
				link: "http://www.twitter.com/#{tweet['user']['screen_name']}",
				displayName: tweet['user']['name'],
				postedTime: DateTime.parse(tweet['user']['created_at']).strftime(date_format),
				image: tweet['user']['profile_image_url'],
				summary: tweet['user']['description'],
				links: [
					{
						href: tweet['user']['url'],
						rel: "me"
					}
				],
				friendsCount: tweet['user']['friends_count'],
				followersCount: tweet['user']['followers_count'],
				listedCount: tweet['user']['listed_count'],
				statusesCount: tweet['user']['statuses_count'],
				twitterTimeZone: tweet['user']['time_zone'],
				verified: tweet['user']['verified'],
				utcOffset: tweet['user']['utc_offset'],
				preferredUsername: tweet['user']['screen_name'],
				languages: [
					tweet['user']['lang']
				],
				favoritesCount: tweet['user']['favourites_count']
			},
			verb: "post",
			postedTime: DateTime.parse(tweet['created_at']).strftime(date_format),
			generator: nil,
			provider: {
				objectType: "service",
				displayName: "Twitter",
				link: "http://www.twitter.com"
			},
			link: "http://www.twitter.com/#{tweet['user']['screen_name']}/statuses/#{tweet['id']}",
			body: tweet['text'],
			object: {
				objectType: "note",
				id: "object:search.twitter.com,2005:#{tweet['id']}",
				summary: tweet['text'],
				link: "http://www.twitter.com/#{tweet['user']['screen_name']}/statuses/#{tweet['id']}",
				postedTime: DateTime.parse(tweet['created_at']).strftime(date_format)
			},
			twitter_entities: tweet['entities'],
			retweetCount: tweet['retweet_count']
		}

		# Older versions of the of the Twitter API return "100+" for the retweet count. Elasticsearch
		# chokes on this since it's not a properly formatted number
		if activity[:retweetCount] == "100+"
			activity[:retweetCount] = 100
		end

		# Filter level is only returned by newer versions of the streaming API
		if tweet['filter_level']
			activity[:twitter_filter_level] = tweet['filter_level']
		end

		# Lang is only returned in newer versions of the streaming API, so fall back to the user's lang
		activity[:twitter_lang] = tweet['lang'] || tweet['user']['lang'];

		# Favorite count was not available before API v1.1
		if tweet['favorite_count']
			activity[:favoritesCount] = tweet['favorite_count']
		end

		# Include location/geo information if available
		if !tweet['user']['location'].blank?
			activity[:actor][:location] = {
				objectType: "place",
				displayName: tweet['user']['location']
			}
		end

		if tweet['place']
			activity[:location] = {
				objectType: "place",
				displayName: tweet['place']['full_name'],
				name: tweet['place']['name'],
				country_code: tweet['place']['country_code'],
				link: tweet['place']['url'],
				geo: tweet['place']['bounding_box']
			}
		end

		if tweet['geo']
			activity[:geo] = tweet['geo']
		end

		# Get generator, default to Twitter web
		# Extract href and link text from source link tag
		matches = /<a href="([^"]+?)".*?>(.+?)<\/a>/.match(tweet['source'])
		if matches
			activity[:generator] = {
				displayName: matches[2],
				link: matches[1]
			}
		end

		if tweet['source'] == "web"
			activity[:generator] = {
				displayName: "web",
				link: "http://www.twitter.com"
			}
		end

		if tweet['retweeted_status']
			activity[:verb] = "share"
			activity[:object] = self.convert(tweet['retweeted_status'])
		end

		activity

	end

end

end
end
