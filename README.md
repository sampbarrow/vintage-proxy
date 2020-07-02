# Vintage Proxy

This is a proxy written using Express that lets you browse the Wayback Machine as if you were browsing the internet.

Simply run using "npm start" and set your proxy settings in your browser to use the hostname that Vintage Proxy is running on, and port 3000 (this is the default port that Express runs on).

This is intended to work with vintage browsers that can not access current web sites.

Note that this does not handle SSL, the assumption being that this is being used on a vintage browser for a time when SSL was not required for most sites.

This also lets you use glob patterns to customize the default date you want to pull from Wayback Machine on a site by site basis. By default, it uses the year 2000.

You can access the configuration page at http://vintage-proxy. See screenshot.png in the repo.

