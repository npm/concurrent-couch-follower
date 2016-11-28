# concurrent-couch-follower
a couch follower wrapper that you can use to be sure you don't miss any documents even if you process them asynchronously.

```js
var changes = require('concurrent-couch-follower')
var someAction = require(.....)

var dataHandler = function(data, done) {
    someAction(data, function() {
      done()
    })
}

var configOptions = {
  db: 'https://url.to.couchdb/registry/_changes',
  include_docs:true,
  sequence:'.sequence',
  now:false,
  concurrency:5
}

changes(dataHandler, configOptions)
```

API
---

### changes(handler,options)

- handler = function(change,done) 
 is a function that is called for every document
 - change, the change from couchdb {seq:sequence,doc:the document,....}
 - done, you must call this function when you are done processing the document.

- options
  a config object as passed to `changes-stream` but including these additional properties.
  - `db`, the connection string url pointing to the CouchDB registry to be followed.
  - `sequence`, the name of the file to persist the sequence id, if this is a function this is passed as a persist function to concurrent-seq-file.
  - `concurrency`, the maximum number of documents to process at a time.
  - the `changes-stream` property `since` is populated by the value of the sequence file and cannot be set from outside except if `now` is set to `true`.
  - `now`, if `true`, set the `changes-stream` property `since` to "now" (instead of 0) on the first start (before `.sequence` has been created)
  - `since` only used, but is required, if you are using a custom backend to save the sequence ids. when you pass a function as sequence.

-  stream = changes(handle,options)
  - sream , return value is a readable object stream of `data` passed back with `done(err,data)`

- stream.sequence()
 - returns current sequence id saved to disk. useful for logging.

- WARNING! stream.end()
 - this calls destroy on the changes-stream and the through instead of properly ending them.
    - this triggers a "premature close" error from `changes-stream` and is something that just has to be worked on. bind `error` or use `end-of-stream`


more examples
-------------

save the sequence ids in a database.

```js
var changes = require('concurrent-couch-follower')
var someAction = require(.....)

var dataHandler = function(data, done) {
    someAction(data, function() {
      done()
    })
}

loadSequenceFromDB(function(err,sequence){
  var configOptions = {
    db: 'https://url.to.couchdb/registry/_changes',
    include_docs:true,
    sequence:function(seq,cb){
      saveInDB(seq,cb)
    },
    since:sequence,
    concurrency:5
  }

  changes(dataHandler, configOptions)
})
```
