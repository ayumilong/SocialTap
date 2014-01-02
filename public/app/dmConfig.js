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

		/* Secondary */
		datasets: {
			title: 'Datasets',
			moduleId: 'app/datasets/Module'
		},
		vis: {
			title: 'Visualizations',
			moduleId: 'app/vis/Module'
		}
	}
});
