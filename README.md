# Vintage Proxy

This is a proxy written using Express that lets you browse the Wayback Machine as if you were browsing the internet.

It is intended to work with vintage browsers that can not access current web sites.

Simply download dependencies using "npm install" in the project's root directory, then run using "npm start". It will automatically listen on all ports from 1996 through the current year. Set the proxy settings in your browser and set the port to the default year you want to use. You can also override this on a per-request basis by going to website.com:xxxx where xxxx is the year.

You can also specify the DEFAULT_YEAR environment variable. This will apply if you are accessing the server with a port < 1996 or > the current year (if you want to run on a standard port for example). If you are running ports 1996 through current year, the DEFAULT_YEAR setting will not apply.

Note that this does not handle SSL, the assumption being that this is being used on a vintage browser for a time when SSL was not required for most sites. All https:// links in HTML code are replace with http://.

