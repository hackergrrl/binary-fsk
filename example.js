var fsk = require('./index')

var opts = {
  mark: 884,
  space: 324,
  baud: 20,
  sampleRate: 8000,
  samplesPerFrame: 100
}

var e = fsk.createEncodeStream(opts)
var d = fsk.createDecodeStream(opts)

e
  .pipe(d)
  .pipe(process.stdout)

e.end('woah, pretty neat!')
