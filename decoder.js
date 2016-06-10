var util = require('util')
var goertzel = require('goertzel')
var Transform = require('stream').Transform

util.inherits(Decoder, Transform)

function Decoder (opts) {
  if (!(this instanceof Decoder)) return new Decoder(opts)

  opts = opts || {}

  if (!opts.baud) throw new Error('must specify opts.baud')
  if (!opts.space) throw new Error('must specify opts.space')
  if (!opts.mark) throw new Error('must specify opts.mark')
  opts.sampleRate = opts.sampleRate || 8000
  opts.samplesPerFrame = opts.samplesPerFrame || getMinSamplesPerFrame(opts.sampleRate, opts.baud)

  function getMinSamplesPerFrame (sampleRate, baud) {
    return Math.floor(sampleRate / baud / 5)
  }

  Transform.call(this, { objectMode: true })

  var hasSpace = goertzel({
    targetFrequency: opts.space,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame,
    threshold: 0.5
  })

  var hasMark = goertzel({
    targetFrequency: opts.mark,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame,
    threshold: 0.5
  })

  var symbolDuration = 1 / opts.baud
  var frameDuration = opts.samplesPerFrame / opts.sampleRate
  var state = 'preamble:space'
  var clock = 0
  var totalTime = 0
  var marksSeen = 0
  var spacesSeen = 0

  var bytePos = 0
  var byteAccum = 0

  this._transform = function (chunk, enc, cb) {
    this.handleFrame(chunk)
    cb(null)
  }

  this._flush = function (done) {
    decideOnSymbol()
    done()
  }

  this.handleFrame = function (frame) {
    var s = hasSpace(frame)
    var m = hasMark(frame)

    var bit
    if (s && !m) bit = 0
    else if (!s && m) bit = 1
    // else console.error('no match: space', s, ' mark', m)

    // console.error('bit', bit, '  clock', clock)

    if (state === 'preamble:space') {
      if (bit === 1) {
        // console.error('preamble:space done @', totalTime)
        // console.error('starting mark clock')
        clock = 0
        state = 'preamble:mark'
      }
    }

    else if (state === 'preamble:mark') {
      // if (bit !== 1) {
      //   throw new Error('got non-mark while in preamble:mark')
      // }
      if (clock >= symbolDuration) {
        // console.error('preamble:mark done @', totalTime)
        // console.error('starting decode')
        clock = 0
        state = 'decode'
        return
      }
    }

    else if (state === 'decode') {
      if (bit === 0) spacesSeen++
      else marksSeen++

      if (clock >= symbolDuration) {
        decideOnSymbol()
      }
    }

    clock += frameDuration
    totalTime += frameDuration
  }

  decideOnSymbol = function () {
    // console.error('saw ', spacesSeen, 'spaces and', marksSeen, 'marks')
    var bit
    var error

    if (marksSeen > spacesSeen) {
      error = spacesSeen
      bit = 1
    } else {
      error = marksSeen
      bit = 0
    }
    spacesSeen = marksSeen = 0
    // console.error('SYMBOL:', bit, '  (err =', error + ')')

    // apply bit to the high end of the byte accumulator
    byteAccum >>= 1
    byteAccum |= (bit << 7)
    bytePos++

    // emit byte if finished
    if (bytePos === 8) {
      var buf = new Buffer(1)
      buf[0] = byteAccum

      this.push(buf)

      byteAccum = 0
      bytePos = 0
    } else if (bytePos > 8) {
      throw new Error('somehow accumulated more than 8 bits!')
    }

    // push clock ahead a frame, since we've already trodden into the next
    // symbol
    clock = frameDuration * error
  }.bind(this)
}

module.exports = Decoder
