var util = require('util')
var goertzel = require('goertzel')
var Readable = require('readable-stream')

util.inherits(Decoder, Readable)

function Decoder (opts) {
  // TODO: instanceof
  // TODO: opts checks

  Readable.call(this)

  // TODO: will this get me in trouble once I'm doing fully async?
  this._read = function (n) {
  }

  var hasSpace = goertzel({
    targetFrequency: opts.space,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  var hasMark = goertzel({
    targetFrequency: opts.mark,
    sampleRate: opts.sampleRate,
    samplesPerFrame: opts.samplesPerFrame
  })

  var state = 'preamble:space'
  var clock = 0
  var totalTime = 0
  var marksSeen = 0
  var spacesSeen = 0

  var bytePos = 0
  var byteAccum = 0

  // TODO: replace with detecting when the input stream ends
  this.done = function () {
    decideOnSymbol()
  }

  // TODO: replace with getting an audio buffer frame from input stream
  this.handleFrame = function (frame) {
    var s = hasSpace(frame)
    var m = hasMark(frame)

    var bit
    if (s && !m) bit = 0
    else if (!s && m) bit = 1
    else throw new Error('no match: space', s, ' mark', m)

    // console.error('bit', bit, '  clock', clock)

    if (state === 'preamble:space') {
      if (bit === 1) {
        console.error('preamble:space done @', totalTime)
        console.error('starting mark clock')
        clock = 0
        state = 'preamble:mark'
      }
    }

    else if (state === 'preamble:mark') {
      // if (bit !== 1) {
      //   throw new Error('got non-mark while in preamble:mark')
      // }
      if (clock >= 1) {
        console.error('preamble:mark done @', totalTime)
        console.error('starting decode')
        clock = 0
        state = 'decode'
        return
      }
    }

    else if (state === 'decode') {
      if (bit === 0) spacesSeen++
      else marksSeen++

      if (clock >= 1) {
        decideOnSymbol()
      }
    }

    clock += opts.samplesPerFrame / opts.sampleRate
    totalTime += opts.samplesPerFrame / opts.sampleRate
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
    console.error('SYMBOL:', bit, '  (err =', error + ')')

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
    clock = opts.samplesPerFrame / opts.sampleRate
  }.bind(this)
}

module.exports = Decoder
