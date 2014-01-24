define(['dojo/_base/declare',
		'dojo/date/locale',
		'dojo/text!./TweetListItem.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, locale, template, _WidgetBase, _TemplatedMixin) {
	return declare([_WidgetBase, _TemplatedMixin], {
		templateString: template,

		data: null,

		_setDataAttr: function(data) {
			this._set('data', data);

			this.actorNameNode.innerHTML = data.actor.displayName;
			this.actorUsernameNode.innerHTML = data.actor.preferredUsername;
			this.actorFollowersCountNode.innerHTML = data.actor.followersCount;
			this.actorFriendsCountNode.innerHTML = data.actor.friendsCount;
			this.postBodyNode.innerHTML = data.body;
			this.postTimeNode.innerHTML = locale.format(new Date(data.postedTime), {
				selector: 'time',
				timePattern: 'h:mm:ss a z'
			});
			this.postDateNode.innerHTML = locale.format(new Date(data.postedTime), {
				datePattern: 'EEE M/d/yyy',
				selector: 'date'
			});
			this.postSentimentNode.innerHTML = '???';
			this.retweetCountNode.innerHTML = data.retweetCount;
			this.hashtagsNode.innerHTML = data.twitter_entities.hashtags.map(function(h) {
				return h.text;
			}).join(', ') || 'None';
			this.mentionsNode.innerHTML = data.twitter_entities.user_mentions.map(function(m) {
				return '<a href="http://twitter.com/' + m.screen_name + '">' + m.name + '</a>';
			}).join(', ') || 'None';
			this.linkNode.innerHTML = '<a href="' + data.link + '">' + data.link + '</a>';
		}
	});
});
