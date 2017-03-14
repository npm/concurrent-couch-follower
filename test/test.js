var test = require('tape')
var eos = require('end-of-stream')
var ccf = require('../')

test("can look at some changes",function(t){

  var firstSeq;
  var pending = []
  var count = 0

  var ended = false;

  t.plan(4)

  var s = ccf(function(data,done){
    count++;
    if(!firstSeq) firstSeq = data.seq;

    done.seq = data.seq

    pending.push(done)
    if(count === 4){
      setImmediate(function(){
        t.equals(pending.length,4,'pending length should still be 4')
        pending.shift()()
      }) 
    } else if(count === 5){

      t.ok(data,'got data after resume.') 
      setTimeout(function(){
        t.equals(s.sequence(),firstSeq,'should have saved first seq id')
     
        // end stream.
        s.end()

      },1000)
    }

  },{
    db:'https://skimdb.npmjs.com/registry',
    concurrency:4,
    sequence:__dirname+'/.test-js-sequence'
  })

  eos(s,function(err){
    console.log(err+' '+err.stack)
    t.ok(err,'how i end changes-stream with destroy triggers premature close error')
  })


})


