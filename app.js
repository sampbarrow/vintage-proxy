
const createError = require('http-errors');
const express = require('express');
const url = require('url');
const http = require('http');

const app = express();

app.get('*', function(req, res, next) {
    try {
        const parsed = url.parse(req.originalUrl);
        const archiveUrl = 'http://web.archive.org/web/' + req.socket.localPort + 'id_/' + parsed.href;
        const serve = proxyUrl => {
            http.get(proxyUrl, archiveRes => {
                if (archiveRes.statusCode === 404) {
                    res.status(404).send("<html><head><title>Vintage Proxy Error</title></head><body><h1>Vintage Proxy Error</h1><p>This URL is not archived. Try the <a href=\"http://" + parsed.host + "\">home page</a>?</p></body></html>");
                }
                else if (archiveRes.statusCode === 302) {
                    const redirectParsed = url.parse(archiveRes.headers['location']);
                    serve((redirectParsed.host ? "" : "http://web.archive.org") + redirectParsed.href);
                }
                else {
                    res.writeHead(200, archiveRes.headers);
                    archiveRes.on('data', chunk => res.write(chunk));
                    archiveRes.on('end', () => res.end());
                    archiveRes.on('close', () => res.end());
                }
            }).on('error', e => {
                res.status(500).send("<html><head><title>Vintage Proxy Error</title></head><body><h1>Vintage Proxy Error</h1><p>Encountered a temporary error (" + e.code + "). You might be loading pages too fast. Please wait a minute and try to refresh.</p></body></html>");
            });
        };
        serve(archiveUrl);
    }
    catch (e) {
        next(e);
    }
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
