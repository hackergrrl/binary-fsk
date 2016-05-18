var Decoder = require('../index')
var test = require('tape')
var concat = require('concat-stream')

function sin (hz, t) {
  return Math.sin(Math.PI * 2 * t * hz)
}

function sinSamples (hz, samples, sampleRate, data) {
  for (var i = 0; i < samples; i++) {
    var v = sin(hz, i / sampleRate)
    data.push(v)
  }
}

function encode (msg, data) {
  msg.forEach(function (ch) {
    ch = ch.charCodeAt(0)
    for (var i=0; i < 8; i++) {
      var bit = ch & 0x1
      ch >>= 1
      sinSamples(bit === 0 ? space : mark, sampleRate / baud, sampleRate, data)
    }
  })
}

test('basic', function (t) {
  var sampleRate = 8000
  var samplesPerFrame = 100
  var space = 324
  var mark = 884
  var baud = 1

  var msg = 'hello world!'.split('')
  var data = []

  // make pre-amble longer
  // sinSamples(space, 30, data)

  // preamble space (>= 1 baud (1 sampleRate))
  sinSamples(space, sampleRate / baud, sampleRate, data)

  // begin space symbol (== 1 baud (1 sampleRate))
  sinSamples(mark, sampleRate / baud, sampleRate, data)

  encode(msg, data)

  var decoder = new Decoder({
    mark: mark,
    space: space,
    baud: baud,
    sampleRate: sampleRate,
    samplesPerFrame: samplesPerFrame
  })

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))

  var i = 0
  while (i < data.length) {
    var frame = data.slice(i, i + samplesPerFrame)
    i += samplesPerFrame
    decoder.write(frame)
  }
  decoder.end()
})
