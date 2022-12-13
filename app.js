
import createError from 'http-errors';
import express from 'express';
import url from 'url';
import Bottleneck from 'bottleneck';
import fetch from 'node-fetch';

const app = express();
app.set("view engine", "pug");
app.set('views', "./");

function getEnv(key, map, def) {
    return process.env[key] ? map(process.env[key]) : def;
}

const minTime = getEnv("MIN_TIME", parseInt, 100);
const maxConcurrent = getEnv("MAX_CONCURRENT", parseInt, 10);
const defaultYear = getEnv("DEFAULT_YEAR", parseInt);

console.info("Starting vintage proxy.");

const limiter = new Bottleneck({
  minTime,
  maxConcurrent,
});

app.get('*', async function(req, res, next) {
    try {
        const parsed = url.parse(req.originalUrl);
        if (parsed.protocol === null || parsed.hostname === null) {
            next({
                status: 400,
                statusText: "Bad Request",
                message: "You have provided an invalid URL (" + req.originalUrl + "). A protocol and hostname are required.",
            });
            return;
        }
        const requestYear = parsed.port;
        if (requestYear !== null && (requestYear < 1996 || requestYear > new Date().getFullYear())) {
            next({
                status: 400,
                statusText: "Bad Request",
                message: "You have specified an invalid port (" + requestYear + ").",
            });
            return;
        }
        const listeningYear = req.socket.localPort >= 1996 && req.socket.localPort <= new Date().getFullYear() ? req.socket.localPort : undefined;
        const year = requestYear || listeningYear || defaultYear;
        const originalUrl = parsed.protocol + "//" + parsed.hostname + parsed.pathname + (parsed.query ? "?" + parsed.query : "");
        console.log("Processing " + year + " request for " + originalUrl + ".");
        limiter.schedule(async () => {
            try {
                const archive = await fetch("http://web.archive.org/web/" + year + "id_/" + originalUrl);
                if (archive.status >= 300) {
                    next({
                        status: archive.status,
                        statusText: archive.statusText,
                        message: "Received a status code of " + archive.status + " from the wayback machine at " + year + " for " + originalUrl + ".",
                    });
                    return;
                }
                const data = await archive.buffer();
                const contentType = archive.headers.raw()["content-type"][0];
                res.writeHead(archive.status, {
                    "content-type": contentType,
                });
                if (contentType === "text/html" && requestYear) {
                    res.end(data.toString().replace(/https?:\/\/([a-zA-Z0-9\-\._]+)/g, "http://$1:" + requestYear));
                }
                else {
                    res.end(data);
                }
            }
            catch (e) {
                    next({
                        status: 500,
                        statusText: "Internal Server Error",
                        message: e.message,
                    });
            }
        });
    }
    catch (e) {
        next(e);
    }
});

app.use(function(req, res, next) {
    next({
        status: 405,
        statusText: "Method Not Allowed",
        message: "This method (" + req.method + ") is not allowed.",
    });
});

app.use(function(err, req, res, next) {
    console.error(err.message);
    res.locals.message = err.message;
    res.locals.error = err;
    res.status(err.status || 500);
    res.render('error');
});

export default app;

