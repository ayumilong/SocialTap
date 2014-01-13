define({
	visualizations: [
		{
			id: 'app/vis/Browse',
			route: '/vis/:dataset_id/browse',
			title: 'Browse'
		},
		{
			id: 'app/vis/WordCloud',
			route: '/vis/:dataset_id/word_cloud',
			title: 'Hashtag Cloud'
		},
		{
			id: 'app/vis/Map',
			route: '/vis/:dataset_id/map',
			title: 'Map'
		},
		{
			id: 'app/vis/LineGraph',
			route: '/vis/:dataset_id/line_graph',
			title: 'Line Graph'
		}
	]
});
