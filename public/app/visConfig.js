define({
	visualizations: [
		{
			id: 'app/vis/Browse',
			route: '/vis/browse/:dataset_id',
			title: 'Browse'
		},
		{
			id: 'app/vis/WordCloud',
			route: '/vis/hashtags/:dataset_id',
			title: 'Hashtag Cloud',
			options: {
				field: 'twitter_entities.hashtags.text'
			}
		},
		{
			id: 'app/vis/Map',
			route: '/vis/map/:dataset_id',
			title: 'Map'
		},
		{
			id: 'app/vis/LineGraph',
			route: '/vis/linegraph/:dataset_id',
			title: "Line Graph"
		}
	]
});
