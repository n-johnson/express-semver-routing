express-semver-routing
======================

An express middleware providing a mechanism for route switching based on a version field of the request. This makes it possible to use semver for express APIs simply by adding a version tag as the first middleware in a route definition.

## Usage

```
const version = require('express-semver-routing')(/* optional arguments /*)

app.get('/api/resource', version('1.x.x'), ...)
app.get('/api/resource', version('2 - 3.1.x'), ...)
```

## Options

Requiring the middleware returns a function that takes optional arguments.

```
Defaults:
{
  errorConstructor: Error, // (Optional) Constructor used to create errors for invalid versions
  header: 'accept-version' // (Optional) Which header to check for the request version
  getVersion: undefined,   // (Optional) Function which receives the express req as a parameter for custom
                           //            version fields allowing more flexibility than the `header` option
}
```

Note: `getVersion` and `header` cannot be used together (will throw if you do) as it'd be ambiguous where to get the version

### Additional Examples

```
// Using a field from the querystring
const version = require('express-semver-routing')({
  getVersion: (req) => req.query && req.query['api-version']
})
```

```
// Using a default version
const version = require('express-semver-routing')({
  getVersion: (req) => req.get('accept-version') || '1.0.0'
})
```
