
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const url = require('url');
const http = require('http');
const mime = require('mime-types');
const vhost = require('vhost');
const fs = require('fs');
const minimatch = require("minimatch");

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = express.Router();
router.use(express.static('public'));
router.get('/', function (req, res, next) {
    try {
        const sites = (function() {
            if (fs.existsSync('sites.json')) {
                const raw = fs.readFileSync('sites.json', 'utf8');
                try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    console.log(e);
                    return [];
                }
            }
            else {
                return [];
            }
        })();
        res.render('index', {
            sites: sites,
        });
    }
    catch (e) {
        next(e);
    }
});
router.post('/', function (req, res, next) {
    if (req.body.newPattern && req.body.newPattern != '*') {
        req.body.sites[req.body.newPattern] = req.body.newDate;
    }
    try {
        const sites = obj = Array.from(Object.values(req.body)).filter(site => site[0] && site[1] && !site[2]).reduce((acc, [ key, val ]) => Object.assign(acc, { [key]: val }), {});
        fs.writeFileSync("sites.json", JSON.stringify(sites));
        res.redirect('/');
    }
    catch (e) {
        next(e);
    }
});

app.use(vhost('vintage-proxy', router));

app.all('*', function(req, res, next) {
    try {
        const sites = (function() {
            if (fs.existsSync('sites.json')) {
                const raw = fs.readFileSync('sites.json', 'utf8');
                try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    console.log(e);
                    return [];
                }
            }
            else {
                return [];
            }
        })();
        const parsed = url.parse(req.originalUrl);
        const date = Object.entries(sites).filter(site => site[0]).sort((a, b) => a[0].length < b[0].length).filter(site => minimatch(parsed.host, site[0])).map(site => site[1])[0] || 2000;
        const archiveUrl = 'http://web.archive.org/web/' + date + 'id_/' + parsed.href;
        const serve = proxyUrl => {
            http.get(proxyUrl, archiveRes => {
                if (archiveRes.statusCode === 302) {
                    serve(archiveRes.headers['location']);
                }
                else {
                    res.writeHead(200, archiveRes.headers);
                    archiveRes.on('data', chunk => res.write(chunk));
                    archiveRes.on('end', () => res.end());
                    archiveRes.on('close', () => res.end());
                }
            }).on('error', e => res.send(e));
        };
        serve(archiveUrl);
    }
    catch (e) {
        next(e);
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
