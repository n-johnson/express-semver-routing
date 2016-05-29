/*eslint-env mocha*/

const should = require('should');

// Not using exhaustive test cases for semver since the semver module this uses
// already has them. Only testing functionality of this module.
const VALID_SEMVER_RANGE = '1.x.x';
const VALID_SEMVER_VERSION = '1.0.1';     // Matches VALID_SEMVER_RANGE
const INCORRECT_SEMVER_VERSION = '2.0.0'; // Doesn't match VALID_SEMVER_RANGE
const INVALID_SEMVER_VERSION = '2.0';     // Not a valid semver version string
const INVALID_SEMVER_RANGE = 'invalid';   // Not a valid semver range

const DEFAULT_HEADER = 'accept-version';

const mockExpressNext = (opt) => (err) => {
  if (opt.error) return should(err).be.an.Error();
  if (opt.success) return should(err).eql(undefined);
  if (opt.nextRoute) return should(err).eql('route'); // Special express param for exiting a route-definition w/o completing it

  throw new Error('mockExpressNext missing param');
};

const mockReqValid = (field) => ({
  get: (x) => (x === field) ? VALID_SEMVER_VERSION : null
});

const mockReqValidNonMatch = (field) => ({
  get: (x) => (x === field) ? INCORRECT_SEMVER_VERSION : null
});

const mockReqInvalid = (field) => ({
  get: (x) => (x === field) ? INVALID_SEMVER_VERSION : null
});

const mockReqMissing = () => ({
  get: () => null
});


describe('semver-routing', () => {
  const version = require('../');

  it('should not accept ambigious arguments', () =>
    (function() {
      version({ getVersion: () => {}, header: 'test' });
    }).should.throw());

  it('should accept valid semver ranges', () =>
    version(/* default args */)(VALID_SEMVER_RANGE).should.be.a.function);

  it('should not accept invalid semver ranges', () => {
    version(/* default args */).bind(INVALID_SEMVER_RANGE).should.throw();
  });

  describe('responds correctly', () => {
    const middleware = version(/* default args */)(VALID_SEMVER_RANGE);

    it('to valid version', () =>
      middleware(mockReqValid(DEFAULT_HEADER), {}, mockExpressNext({ success: true })));

    it('to valid non-matching version', () =>
      middleware(mockReqValidNonMatch(DEFAULT_HEADER), {}, mockExpressNext({ nextRoute: true })));

    it('to invalid version', () =>
      middleware(mockReqInvalid(DEFAULT_HEADER), {}, mockExpressNext({ error: true })));

    it('to missing version', () =>
      middleware(mockReqMissing(), {}, mockExpressNext({ error: true })));
  });

  describe('custom arguments', () => {
    it('custom error constructor', () => {
      const test_err = function() {};
      const middleware_err = version({ errorConstructor: test_err });

      middleware_err(VALID_SEMVER_RANGE)(mockReqInvalid(DEFAULT_HEADER), {}, function next(err) {
        err.should.be.an.instanceof(test_err);
      });
    });

    describe('custom header', () => {
      const middleware = version({ header: 'x-custom'});

      it('valid version', () =>
        middleware(VALID_SEMVER_RANGE)(mockReqValid('x-custom'), {}, mockExpressNext({ success: true })));
      it('invalid version', () =>
        middleware(VALID_SEMVER_RANGE)(mockReqInvalid('x-custom'), {}, mockExpressNext({ error: true })));
      it('non-matching version', () =>
        middleware(VALID_SEMVER_RANGE)(mockReqValidNonMatch('x-custom'), {}, mockExpressNext({ nextRoute: true })));
    });


    describe('custom getVersion function', () => {
      const middleware_getVersion = version({ getVersion: (req) => req.body && req.body.ver });

      it('valid version', () =>
        middleware_getVersion(VALID_SEMVER_RANGE)({ body: { ver: VALID_SEMVER_VERSION } }, {}, mockExpressNext({ success: true })));

      it('invalid version', () =>
        middleware_getVersion(VALID_SEMVER_RANGE)({ body: { ver: INVALID_SEMVER_VERSION } }, {}, mockExpressNext({ error: true })));

      it('non-matching version', () =>
        middleware_getVersion(VALID_SEMVER_RANGE)({ body: { ver: INCORRECT_SEMVER_VERSION } }, {}, mockExpressNext({ nextRoute: true })));
    });
  });
});
