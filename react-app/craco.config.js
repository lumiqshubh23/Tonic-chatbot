const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Optimize hot module replacement
      if (env === 'development') {
        webpackConfig.devServer = {
          ...webpackConfig.devServer,
          hot: true,
          liveReload: false,
          watchFiles: {
            paths: ['src/**/*'],
            options: {
              usePolling: true,
              interval: 1000,
              poll: 1000,
            },
          },
        };

        // Optimize file watching
        webpackConfig.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
      }

      return webpackConfig;
    },
  },
  devServer: {
    hot: true,
    liveReload: false,
    watchFiles: {
      paths: ['src/**/*'],
      options: {
        usePolling: true,
        interval: 1000,
        poll: 1000,
      },
    },
  },
};
