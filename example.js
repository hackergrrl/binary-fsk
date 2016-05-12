var Decoder = require('./index')

var sampleRate = 8000
var samplesPerFrame = 100

var space = 324
var mark = 884

var baud = 1


function sin (hz, t) {
  return Math.sin(Math.PI * 2 * t * hz)
}

function sinFrame (hz) {
  var frame = []
  for (var i = 0; i < samplesPerFrame; i++) {
    var v = sin(hz, i / sampleRate)
    frame.push(v)
  }
  return frame
}

function sinSamples (hz, samples, data) {
  for (var i = 0; i < samples; i++) {
    var v = sin(hz, i / sampleRate)
    data.push(v)
  }
}

var msg = 'hello'.split('')

var data = []

// make pre-amble longer
sinSamples(space, 30, data)

// preamble space (>= 1 baud (1 sampleRate))
sinSamples(space, sampleRate, data)

// begin space symbol (== 1 baud (1 sampleRate))
sinSamples(mark, sampleRate, data)


// TODO: basis for binary-fsk-encoder
msg.forEach(function (ch) {
  ch = ch.charCodeAt(0)
  for (var i=0; i < 8; i++) {
    var bit = ch & 0x1
    ch >>= 1
    // console.log('encoded', bit)
    sinSamples(bit === 0 ? space : mark, sampleRate, data)
  }
})

var decoder = new Decoder({
  mark: mark,
  space: space,
  sampleRate: sampleRate,
  samplesPerFrame: samplesPerFrame
})

decoder.on('data', function (data) {
  console.log('got data', data.toString())
})

var i = 0
while (i < data.length) {
  var frame = data.slice(i, i + samplesPerFrame)
  i += samplesPerFrame
  decoder.handleFrame(frame)
}
decoder.done()

