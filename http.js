
const createError = require('http-errors');
const express = require('express');
const url = require('url');
const Bottleneck = require('bottleneck');
const http = require('http');

const app = express();
app.set("view engine", "pug");
app.set('views', __dirname);

function getEnv(key, map, def) {
    return process.env[key] ? map(process.env[key]) : def;
}

const minTime = getEnv("MIN_TIME", parseInt, 100);
const maxConcurrent = getEnv("MAX_CONCURRENT", parseInt, 10);
const defaultYear = getEnv("DEFAULT_YEAR", parseInt);

const limiter = new Bottleneck({
  minTime,
  maxConcurrent,
});

app.get('*', async function(req, res, next) {
    try {
        const parsed = url.parse(req.originalUrl);
        if (parsed.protocol === null || parsed.hostname === null) {
            /*next({
                status: 404,
                message: "You have provided an invalid URL (" + req.originalUrl + "). A protocol and hostname are required.",
            });
            return;*/
        }
        const requestYear = parsed.port;
        if (parsed.port !== null && (parsed.port < 1996 || parsed.port > new Date().getFullYear())) {
            next({
                status: 404,
                message: "You have specified an invalid port (" + parsed.port + ").",
            });
            return;
        }
        const listeningYear = req.socket.localPort >= 1996 && req.socket.localPort <= new Date().getFullYear() ? req.socket.localPort : undefined;
        const year = requestYear || listeningYear || defaultYear;
        const originalUrl = "http://google.com";//TODO parsed.protocol + "//" + parsed.hostname + parsed.pathname + (parsed.query ? "?" + parsed.query : "");
        console.log("Processing request for " + originalUrl + " in " + year + ".");
        limiter.schedule(async () => {
            const archive = http.request({ host: "web.archive.org", path: "/web/" + year + "id_/" + originalUrl }, function (response) {
                if (response.statusCode >= 400) {
                    next({
                        status: 400,
                        message: "Received a status code of " + response.statusCode + " from the wayback machine.",
                    });
                    return;
                }
                res.writeHead(response.statusCode, {
                    "content-type": response.headers["content-type"],
                });
                var body = '';
                response.on('data', function(chunk) {
                    console.log(chunk);
                    body += chunk;
                });
                response.on('error', function(error) {
                    next({
                        status: 500,
                        message: error.message,
                    });
                    return;
                });
                response.on('end', function() {
                    console.log(body);
                });
                response.on("end", function(chunk) {
                    console.log(body);
                    if (response.headers["content-type"] === "text/html" && specifiedYear) {
                        res.end(body.toString().replace(/https?:\/\/([a-zA-Z0-9\-\._]+)/g, "http://$1:" + specifiedYear));
                    }
                    else {
                        res.end(body);
                    }
                })
            }).end();
/*
            const archiveData = await archive.buffer();
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
*/
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
    console.error("[" + (err.status || 500) + "] " + err.message);
    res.locals.message = err.message;
    res.locals.error = err;
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
