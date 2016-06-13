# concurrent-couch-follower
a couch follower wrapper that you can use to be sure you don't miss any documents even if you process them asynchronously.

```js
var changes = require('concurrent-couch-follower')
var someAction = require(.....)

changes(function(data,done){
  someAction(data,function(){
    done()
  })  
},{
  db:...,
  include_docs:true,
  sequence:'.sequence',
  now:false,
  include_docs:true,
  concurrency:5
})
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
  - `sequence`, the name of the file to persist the sequence id
  - `concurrency`, the maximum number of documents to process at a time.
  - the `changes-stream` property `since` is populated by the value of the sequence file and cannot be set from outside except if `now` is set to `true`.
  - `now`, if `true`, set the `changes-stream` property `since` to "now" (instead of 0) on the first start

-  stream = changes(handle,options)
  - sream , return value is a readable object stream of `data` passed back with `done(err,data)`

- stream.sequence()
 - returns current sequence id saved to disk. useful for logging.

- WARNING! stream.end()
 - this calls destroy on the changes-stream and the through instead of properly ending them.
    - this triggers a "premature close" error from `changes-stream` and is something that just has to be worked on. bind `error` or use `end-of-stream`
