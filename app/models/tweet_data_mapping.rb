require 'json'

class TweetDataMapping < DataMapping

	def self.tweet2activity(tweet)
		activity = {
			id: "tag:search.twitter.com,2005:#{tweet['id']}",
			objectType: "activity",
			actor: {
				objectType: "person",
				id: "id:twitter.com:#{tweet['user']['id']}",
				link: "http://www.twitter.com/#{tweet['user']['screen_name']}",
				displayName: tweet['user']['name'],
				postedTime: Time.parse(tweet['user']['created_at']).utc.strftime("%FT%T.000Z"),
				image: tweet['user']['profile_image_url_https'],
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
				utcOffset: "#{tweet['user']['utc_offset']}",
				preferredUsername: tweet['user']['screen_name'],
				languages: [
					tweet['user']['lang']
				],
				location: {
					objectType: "place",
					displayName: tweet['user']['location']
				},
				favoritesCount: tweet['user']['favourites_count']
			},
			verb: "post",
			postedTime: Time.parse(tweet['created_at']).utc.strftime("%FT%T.000Z"),
			generator: nil,
			provider: {
				objectType: "service",
				displayName: "Twitter",
				link: "http://twitter.com"
			},
			link: "http://twitter.com/#{tweet['user']['screen_name']}/statuses/#{tweet['id']}",
			body: tweet['text'],
			object: {
				objectType: "note",
				id: "object:search.twitter.com,2005:#{tweet['id']}",
				summary: tweet['text'],
				link: "http://twitter.com/#{tweet['user']['screen_name']}/statuses/#{tweet['id']}",
				postedTime: Time.parse(tweet['created_at']).utc.strftime("%FT%T.000Z")
			},
			favoritesCount: tweet['favorite_count'],
			twitter_entities: {
				hashtags: tweet['entities']['hashtags'],
				symbols: tweet['entities']['symbols'],
				urls: tweet['entities']['urls'],
				user_mentions: tweet['entities']['user_mentions']
			},
			twitter_lang: tweet['lang'],
			retweetCount: tweet['retweet_count']
		}

		matches = /<a href="(.+?)".*?>(.+?)<\/a>/.match(tweet['source'])
		if matches
			activity[:generator] = {
				displayName: matches.captures[1],
				link: matches.captures[2]
			}
		else
			activity[:generator] = {
				displayName: tweet['source'],
				link: nil
			}
		end

		if tweet.has_key? 'retweeted_status'
			activity[:object] = self.tweet2activity(tweet['retweeted_status'])
			activity[:verb] = "share"
		end

		activity
	end

	def process(path)

		File.open(path, 'r').each_with_index do |line, line_number|

			begin
				tweet = JSON.parse(line)
			rescue
				@on_error.call("Could not parse tweet on line #{line_number}")
				break
			end

			activity = self.class.tweet2activity(tweet)

			yield activity

		end
	end

end
