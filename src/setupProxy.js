const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy /api requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
'-> http://127.0.0.1:8000' + req.url
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]:', err.message);
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
    })
  );
};
