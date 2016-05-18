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
  var marksSeen = 0
  var spacesSeen = 0

  function sinSamples (hz, samples, data) {
    for (var i = 0; i < samples; i++) {
      var v = sin(hz, i / sampleRate)
      data.push(v)
    }
  }

  function writeByte (b, data) {
    for (var i=0; i < 8; i++) {
      var bit = ch & 0x1
      ch >>= 1
      sinSamples(bit === 0 ? space : mark, sampleRate / baud, data)
    }
  }

  this._transform = function (chunk, enc, cb) {
    var data = []
    for (var i=0; i < chunk.length; i++) {
      writeByte(chunk.readUInt8(i), data)
    }
    cb(null, data)
  }

  // this._flush = function (done) {
  //   decideOnSymbol()
  //   done()
  // }
}

module.exports = Encoder
