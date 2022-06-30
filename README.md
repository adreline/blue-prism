## Blue prism ##

Simple and pretty quick web crawler and indexer, made for the deep web. Made out of boredom.

### How do I get set up? ###

First get the code:

```bash
git clone https://github.com/adreline/blue-prism.git
```

Then install the dependencies:

```bash
cd blue-prism
npm i
```

Next you want to set up the mariadb (note that this assumes you have a db and a user created):

```bash
mysql -u your_database_user -p your_database_name < db/migrate.sql
```

Edit `config.example` according to your specifications and rename it to `config.json`

To start a user interface web server (default port 9997):

```bash
node main.js serve
```

To start a crawling job (if you migrated using the .sql then there is a starting point added already):

```
node main.js
```

### Configuration file explained ###

| Label  | Meaning |
|-|-|
| db | database connection settings (self-explanatory) |
| db/connectionLimit | How many concurrent connections to the db can be opened |
| onion | Tor SOCKS proxy settings |
| onion/connectionLimit | Time in ms after which to give up on retrieving the site being indexed |
| settings/maxHeapSize | Threshold of how many indexed sites can be held in the working memory, before committing them to the database |
| settings/maxQueueSize | Threshold of how many sites can be queued for indexing at any given time |
| settings/maxProxyConnections | How many concurrent requests can the crawler utilize (essentially indexing speed) |
| settings/rowsPerPage | How many rows should graphical front-end display on a single page |
| settings/identity | This is a user-agent header information. Friendly name is recommended |
| root | Working directory |
| blacklist | A list of string values, representing a word you might wish to forbid. The crawler will automatically discard and fetch result if a page title will contain any character sequence present in that list. |

### Disclaimer ###

This is NOT privacy conscious code. I made it just for fun. If you want to use it (which I doubt) you will do it on your own risk.

### Contribution guidelines ###

I'm an expert at producing unmaintainable code so gl w that.

### Who do I talk to? ###

Don't.