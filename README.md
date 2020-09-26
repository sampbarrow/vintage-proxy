# Vintage Proxy

This is a proxy written using Express that lets you browse the Wayback Machine as if you were browsing the internet.

Simply download dependencies using "npm install" in the project's root directory, then run using "npm start". To use it, set your proxy settings in your browser to use the hostname that Vintage Proxy is running on, and port 3000 (this is the default port that Express runs on).

It will run on multiple ports, 1990 through 2020, set your port for the year you want to access.

This is intended to work with vintage browsers that can not access current web sites.

Note that this does not handle SSL, the assumption being that this is being used on a vintage browser for a time when SSL was not required for most sites.

This also lets you use glob patterns to customize the default date you want to pull from Wayback Machine on a site by site basis. By default, it uses the year 2000.

You can access the configuration page at http://vintage-proxy.local/ (obviously you have to be using the proxy to access this). See screenshot.png in the repo.
