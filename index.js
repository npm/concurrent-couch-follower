var changesStream = require('changes-stream')
var pressureStream = require('pressure-stream')
var concurrentSeq = require('concurrent-seq-file')


module.exports = function(handler,config){

  var seq = concurrentSeq(config.sequence||'.sequence')
  config.since = seq.value

  var changes = changesStream(config)
  var pressure = pressureStream(function(change,next){
    var self = this
    saveSeq = seq(change.seq)
    handler(change,function(err,data){
      saveSeq()
      next(false,data)
    })
  },{
    high:config.concurrency,
    max:config.concurrency,
    low:config.low||1
  })

  changes.on('error',function(err){
    pressure.emit('error',err)
  })

  // just for logging. =)
  pressure.sequence = function(){
    return seq.value
  }

  return pressure;
}


