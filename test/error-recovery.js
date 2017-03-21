var test = require('tape');
var Stream = require('stream');
var mock = require('mock-require');

// Inspired by streamtest
var customStream = function(objects, timeout) {
  var stream = new Stream.Readable({objectMode: true});
  objects = objects || [];
  stream._read = function() {
    var object = null;
    if (objects.length) {
      object = objects.shift();
      if (object.error) {
        setTimeout(function() {
          stream.emit('error', object.message);
          stream._read();
        }, timeout || 0);
      } else {
        setTimeout(function() {
          stream.push(object);
        }, timeout || 0);
      }
    }
  };
  return stream;
};

// Data emitted by the mocked registry
var registryData = [
  'Hello',
  {error: true, message: 'First error'},
  {error: true, message: 'Second successive error'},
  ' World',
  {error: true, message: 'Third error'},
  {error: true, message: 'Forth error'},
  '!'
];

// Mock the "require('changes-stream')" to use a custom, mocked stream instead
mock('changes-stream', function() {
  var mockChangesStream = customStream(registryData, 10);
  mockChangesStream.destroy = function() {
  };
  return mockChangesStream;
});

// Mock the "require('concurrent-seq-file')" to prevent .sequence file write
mock('concurrent-seq-file', function() {
  var mockConcurrentSeqFile = function() {
    return function saveSeq() {
    }
  };
  mockConcurrentSeqFile.value = 0;
  return mockConcurrentSeqFile;
});

mock.reRequire('changes-stream');
mock.reRequire('concurrent-seq-file');
var concurrentCouchFollower = mock.reRequire('../');

(function doNotLeakMocksToOtherTests() {
  mock.stopAll();
  mock.reRequire('changes-stream');
  mock.reRequire('concurrent-seq-file');
  mock.reRequire('../');
})();

test('concurrent-couch-follower should manage error recovery', function(t) {
  // 4 errors + the complete "Hello World!" message
  t.plan(5);

  var helloWorld = '';

  concurrentCouchFollower(function(data, done) {
    helloWorld += data;
    done();
    if (helloWorld === 'Hello World!') {
      t.pass('We retrieved the "Hello World!" message');
      t.end()
    }
  }, {
    db: 'http://we.dont.really.care',
    sequence: __dirname + '/.test-js-sequence'
  })
    .on('error', function(err) {
      console.error('Caught error: ', err);
      // We should have 4 errors
      t.pass();
    });
});