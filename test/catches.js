var test = require('tape')
var skim = "https://skimdb.npmjs.com/registry"

var changes = require('../')


test("throws if missing handler",function(t){
  t.plan(1)
  try{
    changes('not a handler',{db:'a'})
  } catch (e){
    t.ok(e,'should have expection')
  }
})

test("throws if missing config",function(t){
  t.plan(1)
  try{
    changes('not a handler')
  } catch (e){
    t.ok(e,'should have expection')
  }
})

test("throws if missing config.db",function(t){
  t.plan(1)
  try{
    changes('not a handler',{})
  } catch (e){
    t.ok(e,'should have expection')
  }
})


