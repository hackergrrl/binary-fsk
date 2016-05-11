var goertzel = require('goertzel')

function Decoder (opts) {
  // TODO: instanceof
  // TODO: opts checks

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
      if (bit !== 1) {
        throw new Error('got non-mark while in preamble:mark')
      }
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
        // console.error('saw ', spacesSeen, 'spaces and', marksSeen, 'marks')

        if (marksSeen > spacesSeen) {
          console.log('SYMBOL: 1')
          console.error('error ---------> ', spacesSeen)
        } else {
          console.log('SYMBOL: 0')
          console.error('error ---------> ', marksSeen)
        }

        spacesSeen = marksSeen = 0
        clock = opts.samplesPerFrame / opts.sampleRate
      }
    }

    clock += opts.samplesPerFrame / opts.sampleRate
    totalTime += opts.samplesPerFrame / opts.sampleRate
  }
}

module.exports = Decoder
