
const createError = require('http-errors');
const express = require('express');
const url = require('url');
const http = require('http');
const https = require('https');
const Bottleneck = require('bottleneck');
const querystring = require("querystring");
const path = require('path');
const fetch = require('node-fetch');
const lodash = require('lodash');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.urlencoded({ extended: false }));

app.use(function(req, res, next) {
    const parsed = url.parse(req.originalUrl);
    req.year = parsed.port || req.socket.localPort;
    req.specifiedYear = parsed.port;
    next();
});

const limiter = new Bottleneck({
  minTime: 100,
  maxConcurrent: 10,
});

/*
const conf = {
    blockSsl: true,
    includeFrame: true,
    defaultYear: 2000,
}
*/

/*
function loadFromArchive(inputUrl, year, specifiedYear, res, next) {
    try {
        const parsed = url.parse(inputUrl);
        const yearSpec = specifiedYear ? ":" + specifiedYear : "";
        if (year == 1000) {
            http.get("http://" + parsed.hostname + parsed.path, httpRes => writeRes("http://" + parsed.hostname + parsed.path, res, httpRes, year));
        }
        else {
            const archiveUrl = 'http://web.archive.org/web/' + year + 'id_/' + parsed.hostname + parsed.path;
            limiter.schedule(() => {
                console.log("Requesting " + archiveUrl + ".");
                http.get(archiveUrl, archiveRes => {
                    //if (archiveRes.statusCode === 404) {
                    //    res.status(404).send("<html><head><title>Vintage Proxy Error</title></head><body><h1>Vintage Proxy Error</h1><p>This URL is not archived. Try the <a href=\"http://" + parsed.host + yearSpec + "\">home page</a>?</p></body></html>");
                    //}
                    //else {
                        writeRes(archiveUrl, res, archiveRes, year);
                    //}
                }).on('error', e => {
                    next(e);
                    //res.status(500).send("<html><head><title>Vintage Proxy Error</title></head><body><h1>Vintage Proxy Error</h1><p>Encountered a temporary error (" + e.code + "). You might be loading pages too fast. Please wait a minute and try to refresh.</p></body></html>");
                });
            });
        }
    }
    catch (e) {
        next(e);
    }
}
*/

    /*
function writeRes(reqUrl, res, httpRes, year) {
    if (httpRes.statusCode >= 300 && httpRes.statusCode < 400 && httpRes.headers.location) {
        const parsed = url.parse(httpRes.headers.location);
        const redirectPrefix = parsed.hostname ? "" : "http://" + url.parse(reqUrl).hostname;
        if (parsed.protocol == "https:") {
            https.get(redirectPrefix + httpRes.headers.location, httpRes => {
                writeRes(reqUrl, res, httpRes, year);
            });
        }
        else {
            http.get(redirectPrefix + httpRes.headers.location, httpRes => {
                writeRes(reqUrl, res, httpRes, year);
            });
        }
    }
    else {
        res.writeHead(httpRes.statusCode, httpRes.headers);
        httpRes.on('data', chunk => {
            if (httpRes.headers["content-type"] === "text/html") {
                res.write(chunk.toString().replace(/https?:\/\/([a-zA-Z0-9\-\._]+)/g, "http://$1:" + year));
            }
            else {
                res.write(chunk);
            }
        });N
        httpRes.on('end', () => res.end());
        httpRes.on('close', () => res.end());
    }
}
*/
/*
app.get("/vpsite", async function(req, res, next) {
    loadFromArchive(req.query.url, req.year, req.specifiedYear, res, next);
});
*/

/*
app.get("/vpinfo", async function(req, res, next) {
    try {
        const avReq = await fetch("http://archive.org/wayback/available?url=" + req.query.url + "&timestamp=" + req.year);
        const avJson = await avReq.json();
        res.render("info", {
            url: req.query.url,
            availability: avJson,
        });
    }
    catch (e) {
        next(e);
    }
});
*/

function modUrl(inputUrl, params = {}) {
    const parsed = url.parse(inputUrl);
    const qs = querystring.parse(parsed.query);
    return parsed.protocol + "//" + parsed.hostname + parsed.pathname + (qs ? "?" + querystring.stringify(lodash.omitBy({ ...qs, ...params }, lodash.isNil)) : "");
}

app.get('*', async function(req, res, next) {
    try {
        /*
        if (req.query.vpInfo) {
            const avReq = await fetch("http://archive.org/wayback/available?url=" + modUrl(req.originalUrl, { vpInfo: undefined }) + "&timestamp=" + req.year);
            const avJson = await avReq.json();
            res.render("info", {
                url: modUrl(req.originalUrl, { vpInfo: undefined }),
                availability: avJson,
            });
        }
        else if (req.query.vpFrame) {
            const avReq = await fetch("http://archive.org/wayback/available?url=" + modUrl(req.originalUrl, { vpFrame: undefined }) + "&timestamp=" + req.year);
            const av = await avReq.json();
            if (av.archived_snapshots) {
                res.render("frame", {
                    url: modUrl(req.originalUrl, { vpFrame: undefined }),
                    frameUrl: modUrl(req.originalUrl, { vpFrame: undefined }),
                    infoUrl: modUrl(req.originalUrl, { vpFrame: undefined, vpInfo: true }),
                    year: req.year,
                });
            }
            else {
                next({
                    status: 404,
                    message: "This URL is not archived",
                });
            }
        }
        else {*/
            limiter.schedule(async () => {
                const archive = await fetch("http://web.archive.org/web/" + req.year + "id_/" + modUrl(req.originalUrl));
                const archiveData = await archive.buffer();
                if (archive.status === 404) {
                    next({
                        status: 404,
                        message: "This URL is not archived.",
                    });
                }
                else {
                    res.writeHead(archive.status, {
                        "content-type": archive.headers.raw()["content-type"],
                    });
                    res.end(archiveData);
                }
            });
        //}
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
