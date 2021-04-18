
const createError = require('http-errors');
const express = require('express');
const url = require('url');
const Bottleneck = require('bottleneck');
const fetch = require('node-fetch');

const app = express();
//app.use(express.urlencoded({ extended: false }));

const limiter = new Bottleneck({
  minTime: 100,
  maxConcurrent: 10,
});

app.get('*', async function(req, res, next) {
    try {
        const parsed = url.parse(req.originalUrl);
        const year = parsed.port || req.socket.localPort;
        const specifiedYear = parsed.port;
        const originalUrl = parsed.protocol + "//" + parsed.hostname + parsed.pathname + (parsed.query ? "?" + parsed.query : "");
        limiter.schedule(async () => {
            const archive = await fetch("http://web.archive.org/web/" + year + "id_/" + originalUrl);
            const archiveData = await archive.buffer();
            if (archive.status === 404) {
                next({
                    status: 404,
                    message: "This URL is not archived.",
                });
            }
            else {
                const contentType = archive.headers.raw()["content-type"][0];
                res.writeHead(archive.status, {
                    "content-type": contentType,
                });
                if (contentType === "text/html" && specifiedYear) {
                    res.end(archiveData.toString().replace(/https?:\/\/([a-zA-Z0-9\-\._]+)/g, "http://$1:" + specifiedYear));
                }
                else {
                    res.end(archiveData);
                }
            }
        });
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
  res.locals.error = err;
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
