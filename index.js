const semver = require('semver');

// opts:
//   errorConstructor: (Optional) function to construct errors with (default: Error)
//   getVersion: (Optional) Function to turn an express request object into a string representing the version
//     ex: Can be used to parse the version from wherever in the request you want (as opposed to the default header)
//         `(req) => req.body.version`
//   header: (Optional) header field specifying the name of the header to check for the version (default: 'accept-version')
//
//   Cannot set both header and getVersion opts

// checkHeader :: String -> Express.Request -> String
const checkHeader = (header) => (req) => req.get(header);

// version :: Object -> String -> (Express Middleware)
const version = (opts) => {
  opts = opts || {};
  const errCons = opts.errorConstructor || Error;
  const getVersion = opts.getVersion || checkHeader(opts.header || 'accept-version');

  // Most likely the module was required but not initialzed - so when it's used as a middleware it's not actually a middleware. Throw immediatley to prevent runtime errors.
  if (typeof opts === 'string') { throw new Error('express-semver-routing expects config parameter to be an object, string provided. Make sure you are calling the module as a function before using it as a middleware. Ex: const version = require("express-semver-routing")()'); }

  // Ambiguous fields set - throw since it's a programmer error
  if (opts.getVersion && opts.header) { throw new Error('Ambiguous arguments provided to express-semver-routing module. Cannot set both "getVersion" and "header" fields.'); }

  return (svRange) => {
    // Invalid range in route definition - throw since it's a programmer error
    if (!semver.validRange(svRange)) { throw new Error('Invalid semver value provided: ' + svRange); }

    return (req, res, next) => {
      const ver = getVersion(req);

      // Invalid versions specified by incoming request - pass error to client
      if (!ver) { return next(new errCons('No API version specified on request')); }
      if (!semver.valid(ver)) { return next(new errCons('Invalid API Version specified. Semver format expected (ex: 1.0.0)')); }

      return semver.satisfies(ver, svRange)
        ? next() // Continue processing existing route
        : next('route'); // Exits current route definition
    };
  };
};

module.exports = version;
