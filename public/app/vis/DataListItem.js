define([
		"dojo/_base/declare"
		,"dojo/dom"
		,"dojo/dom-class"
		,"dojo/dom-construct"
		,"dojo/_base/window"
		,"dojo/dom-style"
		,"dojo/dom-attr"
		,"dojo/_base/lang"
		,"dojo/_base/Deferred"
		,"dojo/DeferredList"
		,"dojo/on"
		,"dojo/date/locale"
		

		,"dojox/mobile/ListItem"
		,"dojox/mobile/ContentPane"

		
		
		,"dojo/ready"

	], function(
		declare
		,dom
		,domClass
		,domConstruct
		,domWindow
		,domStyle
		,domAttr
		,lang
		,Deferred
		,DeferredList
		,on
		,locale
		
		
		,ListItem
		,Pane
		
		,ready
	){
		return declare("DataListItem",[Pane], {
			variableHeight: true,
			"class": "feedItemListItemClass",
			
			constructor: function(args){
			},
			
			postCreate: function(){
				this.buildView();
			},

			resize: function() {
				console.log("this happens");	
			},
			
			buildView: function(){				
				var sentiment, hashtags = "", mentions = "", links ="";
				var i;
				switch(this.data.sentiment) {
					case -1:
						sentiment = "Negative";
					break;
					case 0:
						sentiment = "Neutral";
					break;
					case 1:
						sentiment = "Positive";
					break;
					default:
						sentiment = "---";
					break;
				}

				if (this.data.twitter_entities.hashtags.length == 0) {
					hashtags = "---";
				}
				for (i = 0; i < this.data.twitter_entities.hashtags.length; i++) {
					hashtags = hashtags + this.data.twitter_entities.hashtags[i].text;
					if (i < this.data.twitter_entities.hashtags.length - 1) {
						hashtags = hashtags + ", ";
					}
				}

				if (this.data.twitter_entities.user_mentions.length == 0) {
					mentions = "---";
				}
				for (i = 0; i < this.data.twitter_entities.user_mentions.length; i++) {
					mentions = mentions + this.data.twitter_entities.user_mentions[i].text;
					if (i < this.data.twitter_entities.user_mentions.length - 1) {
						mentions = mentions + ", ";
					}
				}
				
				

				this.content = new Pane({
					"class": "content"
				});

				this.userInfo = new Pane({
					"class": "content paneLeftClass"
				});

				this.tweetInfo = new Pane({
					"class" : "content paneRightClass"
				});


				// Draws information about the user.
				this.profilePic = new Pane({
					innerHTML: '<img src="app/resources/img/blankPerson.png" width="200px" hieght="200px" />',
					"class": "profilePic"
				});
				this.userInfo.addChild(this.profilePic);

				this.userInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Name: </b>" + this.data.actor.displayName
				}));

				this.userInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Username: </b>" + this.data.actor.preferredUsername
				}));

				this.userInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Followers: </b>" + this.data.actor.followersCount
				}));
				this.userInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Friends: </b>" + this.data.actor.friendsCount
				}));


				// Draws information about the tweet.
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Body: </b>" + this.data.body
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Time: </b>" + this.dateFormat(this.data.postedTime, "h:mm:ss a z")
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Date: </b>" + this.dateFormat(this.data.postedTime, "MMM d, yyyy")

				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Sentiment: </b>" + sentiment
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Retweets: </b>" + this.data.retweet_count
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Hashtags: </b>" + hashtags
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: "<b>Mentions: </b>" + mentions
				}));
				this.tweetInfo.domNode.appendChild(domConstruct.create("div", {
					"class" : "mblAccordionListItem",
					innerHTML: '<b>Link: </b><a href="' + this.data.link + '">' + this.data.link + '</a>'
				}));

				// Puts everything in the right spots.
				this.addChild(this.content);
				this.content.addChild(this.userInfo);
				this.content.addChild(this.tweetInfo);
		
			},
			dateFormat: function(incoming, fmt) { 
				var date = new Date(incoming);
				return locale.format( date, {selector:"date", datePattern:fmt } ); 
			}
		});
	}
);
