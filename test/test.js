var fsk = require('../index')
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

function writeEncodedMessage (msg, opts, data) {
  msg.forEach(function (ch) {
    ch = ch.charCodeAt(0)
    for (var i=0; i < 8; i++) {
      var bit = ch & 0x1
      ch >>= 1
      sinSamples(bit === 0 ? opts.space : opts.mark,
          opts.sampleRate / opts.baud, opts.sampleRate, data)
    }
  })
}

function writePreamble (opts, data) {
  // preamble space (>= 1 baud (1 sampleRate))
  sinSamples(opts.space, opts.sampleRate / opts.baud, opts.sampleRate, data)

  // begin space symbol (== 1 baud (1 sampleRate))
  sinSamples(opts.mark, opts.sampleRate / opts.baud, opts.sampleRate, data)
}

test('basic', function (t) {
  var opts = {
    sampleRate: 8000,
    samplesPerFrame: 100,
    space: 324,
    mark: 884,
    baud: 1
  }

  var msg = 'hello world!'.split('')
  var data = []

  writePreamble(opts, data)

  writeEncodedMessage(msg, opts, data)

  var decoder = fsk.createDecodeStream({
    mark: opts.mark,
    space: opts.space,
    baud: opts.baud,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))

  var i = 0
  while (i < data.length) {
    var frame = data.slice(i, i + opts.samplesPerFrame)
    i += opts.samplesPerFrame
    decoder.write(frame)
  }
  decoder.end()
})

test('extra long preamble', function (t) {
  var opts = {
    sampleRate: 8000,
    samplesPerFrame: 100,
    space: 324,
    mark: 884,
    baud: 1
  }

  var msg = 'hello world!'.split('')
  var data = []

  // make pre-amble longer
  sinSamples(opts.space, 30, opts.sampleRate, data)

  writePreamble(opts, data)

  writeEncodedMessage(msg, opts, data)

  var decoder = fsk.createDecodeStream({
    mark: opts.mark,
    space: opts.space,
    baud: opts.baud,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))

  var i = 0
  while (i < data.length) {
    var frame = data.slice(i, i + opts.samplesPerFrame)
    i += opts.samplesPerFrame
    decoder.write(frame)
  }
  decoder.end()
})

test('high frequency', function (t) {
  var opts = {
    sampleRate: 44100,
    samplesPerFrame: 100,
    space: 324,
    mark: 884,
    baud: 1
  }

  var msg = 'hello world!'.split('')
  var data = []

  writePreamble(opts, data)

  writeEncodedMessage(msg, opts, data)

  var decoder = fsk.createDecodeStream({
    mark: opts.mark,
    space: opts.space,
    baud: opts.baud,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))

  var i = 0
  while (i < data.length) {
    var frame = data.slice(i, i + opts.samplesPerFrame)
    i += opts.samplesPerFrame
    decoder.write(frame)
  }
  decoder.end()
})

test('non-standard opts', function (t) {
  var opts = {
    sampleRate: 8000,
    samplesPerFrame: 200,
    space: 481,
    mark: 1390,
    baud: 10
  }

  var msg = 'hello world!'.split('')
  var data = []

  writePreamble(opts, data)

  writeEncodedMessage(msg, opts, data)

  var decoder = fsk.createDecodeStream({
    mark: opts.mark,
    space: opts.space,
    baud: opts.baud,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))

  var i = 0
  while (i < data.length) {
    var frame = data.slice(i, i + opts.samplesPerFrame)
    i += opts.samplesPerFrame
    decoder.write(frame)
  }
  decoder.end()
})
