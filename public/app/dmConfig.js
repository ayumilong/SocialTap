// dojo-mama configuration
define({
	title: 'SocialTap<span style="vertical-align: super; font-size: 12px; text-transform: uppercase; margin-left: 5px; color: #f66733;">Beta</span>',
	titleLabel: 'SocialTap',
	nav: {
		/* navigational elements point to groups */
		primary: [],
		/* secondary links show up in the meta nav secondary: */
		secondary: [
			'vis'
		]
	},
	networkErrorMessage: "We're sorry. There seems to be a network issue. Please try again later.",
	networkTimeout: 15000,
	modules: {
		index: {
			moduleId: 'app/index/Module'
		},


		/* Secondary */
		datasets: {
			title: 'Datasets',
			moduleId: 'app/datasets/Module'
		},
		datasources: {
			title: 'Data Sources',
			moduleId: 'app/datasources/Module'
		},
		vis: {
			title: 'Visualizations',
			moduleId: 'app/vis/Module'
		}
	}
});