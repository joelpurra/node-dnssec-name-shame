# [node-dnssec-name-shame](https://github.com/joelpurra/node-dnssec-name-shame)
[dnssec-name-and-shame.com](http://dnssec-name-and-shame.com/)

Look at a domain and check for DNSSEC records. Naming and shaming included!

Initially developed during [The Next Web's](http://thenextweb.com/) [Kings of Code Hack Battle](http://thenextweb.com/conference/europe/hack-battle/) 2014 in Amsterdam, The Netherlands.



## Requirements

- [getdns](https://github.com/getdnsapi/getdns), see [getdnsapi.net](http://getdnsapi.net/).
- [node.js](http://nodejs.org/) and [Node Package Manager](https://www.npmjs.org/) (NPM).
- [MongoDB](http://www.mongodb.org/).
- [Bower](http://bower.io/).



## Getting started

- Make sure getdns is installed properly, including [unbound's root anchor](http://www.unbound.net/documentation/howto_anchor.html). If the root anchor isn't set up properly, all DNS lookups will be labeled insecure.
- Make sure mongodb is running.

```bash
# Clone the repository
git clone --recursive https://github.com/joelpurra/node-dnssec-name-shame.git node-dnssec-name-shame
cd node-dnssec-name-shame

# Install dependencies
npm install
bower install

# Start the server
node app/web.js
```

- Browse to your local test site, [http://localhost:5000/](http://localhost:5000/).



## Todo

&#9744; Modify links to the external sites to open in new window, and add link to `/name-shame/` JSON URL canceled with javascript.  
&#9744; Create pretty-pretty slide show style animations for the listed example domains?  
&#9745; Tweet the results.  
&#9745; Add sounds for pass and fail.  
&#9745; Create a small API.  



## Thanks

- [Versign Labs](http://labs.verisigninc.com/).
- [NLnet Labs](http://nlnetlabs.nl/).
- [Anne-Marie Eklund Löwinder](https://twitter.com/amelsec), DNSSEC pioneer and [Internet Hall of Fame inductee](http://www.internethalloffame.org/inductees/anne-marie-eklund-l%C3%B6winder), for the photo made specially for this site.
- Photo of [Anne-Marie Eklund Löwinder](https://twitter.com/amelsec) by [Per-Ola Mjömark](http://www.mjomark.com/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Fail sound [buzzer2.wav](https://www.freesound.org/people/hypocore/sounds/164089/) by [hypocore](https://www.freesound.org/people/hypocore/), licensed under [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/).
- Success sound [success.wav](https://www.freesound.org/people/grunz/sounds/109662/) by [grunz](https://www.freesound.org/people/grunz/), licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).


## License

Copyright (c) 2014, [Joel Purra](http://joelpurra.com/) and Tom Cuddy. All rights reserved.

When using node-dnssec-name-shame, comply to the [GNU Affero General Public License 3.0 (AGPL-3.0)](https://en.wikipedia.org/wiki/Affero_General_Public_License). Please see the LICENSE file for details.

