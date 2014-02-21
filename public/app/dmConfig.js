// dojo-mama configuration
define({
	networkErrorMessage: "We're sorry. There seems to be a network issue. Please try again later.",
	networkTimeout: 15000,
	modules: {
		index: {
			moduleId: 'app/index/Module'
		},
		auth: {
			moduleId: 'app/auth/Module'
		},
		datasets: {
			title: 'Datasets',
			moduleId: 'app/datasets/Module'
		},
		reports: {
			title: 'Reports',
			moduleId: 'app/reports/Module'
		},
		vis: {
			title: 'Visualizations',
			moduleId: 'app/vis/Module'
		}
	},
	topNav: [
		{
			route: '/datasets/:dataset_id',
			title: 'Info'
		},
		{
			route: '/vis/:dataset_id/browse',
			title: 'Browse'
		},
		{
			route: '/vis/:dataset_id/word_cloud',
			title: 'Hashtag Cloud'
		},
		{
			route: '/vis/:dataset_id/map',
			title: 'Map'
		},
		{
			route: '/vis/:dataset_id/line_graph',
			title: 'Line Graph'
		}
	]
});
