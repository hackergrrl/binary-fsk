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

  var encoder = fsk.createEncodeStream(opts)
  var decoder = fsk.createDecodeStream(opts)

  encoder.pipe(decoder)

  encoder.end('hello world!')

  decoder.pipe(concat(function (data) {
    t.equal(data.toString(), 'hello world!')
    t.end()
  }))
})

test('high baud', function (t) {
  var opts = {
    space: 324,
    mark: 884,
    baud: 100,
    sampleRate: 8000,
    samplesPerFrame: 2000
  }
  opts.samplesPerFrame = getMinSamplesPerFrame(opts.sampleRate, opts.baud)

  function getMinSamplesPerFrame (sampleRate, baud) {
    return Math.floor(sampleRate / baud / 5)
  }

  var e = fsk.createEncodeStream(opts)
  var d = fsk.createDecodeStream(opts)

  e
    .pipe(d)
    .pipe(concat(function (data) {
      t.equal(data.toString(), 'woah, pretty neat!')
      t.end()
    }))
  e.end('woah, pretty neat!')
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
    sampleRate: 11025,
    samplesPerFrame: 500,
    space: 324,
    mark: 884,
    baud: 1
  }

  var msg = 'hey thar'.split('')
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
    t.equal(data.toString(), 'hey thar')
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
