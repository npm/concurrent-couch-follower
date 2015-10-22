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
  a config object as passed to `changes-stream` but including these addtional properties.
  - `sequence`, the name of the file to persist the sequence id
  - `concurrency`, the maxumum number of documents to process at a time.
  - the `changes-stream` property `since` is populated by the value of the sequence file and cannot be set from outside.

-  stream = changes(handle,options)
  - sream , return value is a readable object stream of `data` passed back with `done(err,data)`

- stream.sequence()
 - returns current sequence id saved to disk. useful for logging.

