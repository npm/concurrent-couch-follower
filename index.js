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

  var seq = concurrentSeq(config.sequence || '.sequence')
  config.since = (config.now === true) ? 'now' : seq.value

  var changes = changesStream(config)
  var pressure = pressureStream(function (change, next) {
    var saveSeq = seq(change.seq)
    handler(change, function (err, data) {
      saveSeq()
      next(err, data)
    })
  }, {
    high: config.concurrency || 4,
    max: config.concurrency || 4,
    low: config.low || config.concurrency || 4
  })

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
    changes.destroy()
    this.destroy()
  }

  return pressure
}
