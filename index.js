var changesStream = require('changes-stream')
var pressureStream = require('pressure-stream')
var concurrentSeq = require('concurrent-seq-file')
var undef

module.exports = function (handler, config) {
  if (!handler || typeof handler !== 'function') throw new Error('first argument should be function to use as a document handler')
  if (!config) throw new Error('config object required. fn(handler,config)')
  if (typeof config === 'string') config = {db: config}
  if (!config.db) throw new Error('missing required "db" key in config.')

  // include_docs by default
  if (config.include_docs === undef) config.include_docs = true
 
  var seq
  if(typeof config.sequence === 'function'){
    if(config.since === undefined) {
      throw new Error("config.since must be set and must be the last value you saved in your database if using custom persist backend. if you dont have one set this to 0")
    }
    seq = concurrentSeq.starter(config.sequence,{savedValue:config.since})
    seq.value = config.since
  } else {
    seq = concurrentSeq(config.sequence || '.sequence')
  }
  config.since = seq.value
  var firstStart = (seq.value === 0)
  if (firstStart) {
    config.since = (config.now === true) ? 'now' : 0
  }

  var changes = changesStream(config)
  var pressure = pressureStream(function (change, next) {
    var saveSeq = seq(change.seq)
    handler(change, function (err, data) {
      saveSeq()
      next(err, data)
    })
  }, config.concurrency || 4)

  changes.on('error', function (err) {
    pressure.emit('error', err)
  })

  changes.pipe(pressure)

  // just for logging. =)
  pressure.sequence = function () {
    return seq.value
  }

  
  // hack to make ending the streams work-ish
  // i only end in tests anyway.
  pressure.end = function(){
    //
    changes.destroy()
    this.destroy()
  }

  return pressure
}
