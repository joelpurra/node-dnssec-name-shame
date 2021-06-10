<p align="center">
  <a href="https://dnssec-name-and-shame.com/"><img src="public/resources/image/angry.jpg" alt="Photo of Anne-Marie Eklund Löwinder, DNSSEC pioneer, when she's angry" title="Photo of Anne-Marie Eklund Löwinder, DNSSEC pioneer, when she's angry" width="300" height="200" border="0" /></a>
</p>
<h1 align="center">
  <a href="https://dnssec-name-and-shame.com/">dnssec-name-and-shame.com</a>
</h1>


Look at a domain and check for DNSSEC records. Naming and shaming included!

Initially developed during [The Next Web's](https://thenextweb.com/) [Kings of Code Hack Battle](https://thenextweb.com/conference/europe/hack-battle/) 2014 in Amsterdam, The Netherlands.



## Notes

- This implementation only checks a domain for signed A, AAAA, CNAME, MX and SOA records. You might want to try another tool for more extensive DNSSEC tests and analysis.
- Lookups are cached in getdns' context for the duration of the server's uptime. DNS record TTL should also be in effect.
- [Source code](https://github.com/joelpurra/node-dnssec-name-shame), [project page](https://joelpurra.com/projects/node-dnssec-name-shame/).



## Requirements

- [getdns](https://github.com/getdnsapi/getdns), see [getdnsapi.net](https://getdnsapi.net/).
- [node.js](https://nodejs.org/) and [Node Package Manager `npm`](https://www.npmjs.org/) (NPM).
- [MongoDB](https://www.mongodb.org/).
- [Bower](https://bower.io/).



## Getting started

- Make sure getdns is installed properly, including [unbound's root anchor](https://www.unbound.net/documentation/howto_anchor.html). If the root anchor isn't set up properly, all DNS lookups will be labeled insecure.
- Make sure mongodb is running.

```bash
# Clone the repository
git clone --recursive https://github.com/joelpurra/node-dnssec-name-shame.git node-dnssec-name-shame
cd node-dnssec-name-shame

# Install dependencies
npm install
./node_modules/.bin/bower install

# Start the server. Note that logging is in bunyan's json format.
npm start
```

Browse to your local test site, [https://localhost:5000/](http://localhost:5000/).



## Development

```bash
# Start the server in debugging mode
npm run debug

# Test the code
npm test --silent
```

Optionally debug the server, possibly using [Chrome DevTools for Node.js](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27).



## Todo

&#9744; Fetch Alexa's top 25 (or more) sites dynamically.
&#9744; Create pretty-pretty slide show style animations for the listed example domains?
&#9745; Modify links to the external sites to open in new window, and add link to `/domain/example.com` so content can be discovered.
&#9745; Tweet the results.
&#9745; Add sounds for pass and fail.
&#9745; Create a small API.
&#9745; Download Google Fonts and serve locally: `google-font-download "Quando" "Pacifico" "'Open Sans'"`.



## Thanks

- [Versign Labs](https://labs.verisigninc.com/).
- [NLnet Labs](https://nlnetlabs.nl/), with special thanks to [Willem Toorop](https://nlnetlabs.nl/bios/willem/) ([@wtoorop](https://github.com/wtoorop)) for all the help with the DNAS server(s).
- [Anne-Marie Eklund Löwinder](https://twitter.com/amelsec), DNSSEC pioneer and [Internet Hall of Fame inductee](https://www.internethalloffame.org/inductees/anne-marie-eklund-l%C3%B6winder), for the photo made specially for this site.
- Photo of [Anne-Marie Eklund Löwinder](https://twitter.com/amelsec) by [Per-Ola Mjömark](http://www.mjomark.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Fail sound [buzzer2.wav](https://www.freesound.org/people/hypocore/sounds/164089/) by [hypocore](https://www.freesound.org/people/hypocore/), licensed under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- Success sound [success.wav](https://www.freesound.org/people/grunz/sounds/109662/) by [grunz](https://www.freesound.org/people/grunz/), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).


## License

Copyright © 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021 [Joel Purra](https://joelpurra.com/) and Tom Cuddy. All rights reserved.

When using node-dnssec-name-shame, comply to the [GNU Affero General Public License 3.0 (AGPL-3.0)](https://en.wikipedia.org/wiki/Affero_General_Public_License). Please see the LICENSE file for details.
