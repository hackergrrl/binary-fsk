var util = require('util')
var Transform = require('stream').Transform

util.inherits(Encoder, Transform)

function Encoder (opts) {
  if (!(this instanceof Encoder)) return new Encoder(opts)

  opts = opts || {}

  if (!opts.baud) throw new Error('must specify opts.baud')
  if (!opts.space) throw new Error('must specify opts.space')
  if (!opts.mark) throw new Error('must specify opts.mark')
  if (!opts.sampleRate) throw new Error('must specify opts.sampleRate')
  if (!opts.samplesPerFrame) throw new Error('must specify opts.samplesPerFrame')

  Transform.call(this, { objectMode: true })

  var symbolDuration = 1 / opts.baud
  var frameDuration = opts.samplesPerFrame / opts.sampleRate
  var state = 'preamble:space'
  var clock = 0
  var totalTime = 0

  function sin (hz, t) {
    return Math.sin(Math.PI * 2 * t * hz)
  }

  function sinSamples (hz, samples, data) {
    for (var i = 0; i < samples; i++) {
      var v = sin(hz, i / opts.sampleRate)
      data.push(v)
    }
  }

  function writeByte (b, data) {
    for (var i=0; i < 8; i++) {
      var bit = b & 0x1
      b >>= 1
      sinSamples(bit === 0 ? opts.space : opts.mark,
          opts.sampleRate / opts.baud, data)
    }
  }

  function writePreamble (opts, data) {
    // preamble space (>= 1 baud (1 sampleRate))
    sinSamples(opts.space, opts.sampleRate / opts.baud, data)

    // begin space symbol (== 1 baud (1 sampleRate))
    sinSamples(opts.mark, opts.sampleRate / opts.baud, data)
  }

  // internal buffer
  var data = []
  var frame = new Float32Array(opts.samplesPerFrame)

  var firstWrite = true
  this._transform = function (chunk, enc, next) {
    if (typeof(chunk) === 'string') {
      chunk = new Buffer(chunk)
    }

    if (firstWrite) {
      writePreamble(opts, data)
      firstWrite = false
    }

    for (var i=0; i < chunk.length; i++) {
      writeByte(chunk.readUInt8(i), data)
    }

    // Split into chunks
    var frames = Math.floor(data.length / opts.samplesPerFrame)
    // var start = new Date().getTime()
    for (var i=0; i < frames; i++) {
      var idx = i * opts.samplesPerFrame
      var frame = data.slice(idx, idx + opts.samplesPerFrame)
      this.push(frame)
    }
    // var end = new Date().getTime()
    // console.log('wrote frames in', (end-start), 'ms')

    next()
  }

  this._flush = function (done) {
    this.push(data)
    done()
  }
}

module.exports = Encoder
