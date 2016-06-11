# binary-fsk

> streaming encoder/decoder for binary frequency-shift keying

https://en.wikipedia.org/wiki/Frequency-shift_keying

## STATUS

Work-in-progress. Works great if you pipe the encoder to the decoder, but still
working on getting it working well in noisy / real-world environments!


## Usage

Let's encode the string 'Hello!' into sound waves and then back again to a
string:

```js
var bfsk = require('binary-fsk')
var speaker = require('audio-speaker')
var microphone = require('mic-stream')

var opts = {
  mark: 884,
  space: 324,
  baud: 5,
  sampleRate: 8000,
  samplesPerFrame: 320
}

var encode = fsk.createEncodeStream(opts)
var decode = fsk.createDecodeStream(opts)

// pipe to your speaker
encode
  .pipe(speaker())

// receive sound from your speaker and decode it back to text to print out
microphone()
  .pipe(decode)
  .pipe(process.stdout)

// write a message!
e.end('heya!')
```

This will make your computer scream garbage at you (make sure your speakers and
microphone are on!) briefly, but it should then output

```
hello warld!
```

## API

```js
var bfsk = require('binary-fsk')
```

### bfsk.createEncodeStream(opts)

Returns a Transform stream. Pipe text or other interesting data into this, and
it will output audio data. You can pipe this to your speakers.

Valid `opts` include:

- `mark` (required) - the "mark" frequench, in hertz. This frequency is used to
  signal a '1' bit.
- `space` (required) - the "space" frequench, in hertz. This frequency is used
  to signal a '0' bit.
- `baud` (required) - the number of bits to transmit/expect, per second.
- `sampleRate` (optional) - the number of samples per second. Defaults to 8000.


### bfsk.createDecodeStream(opts)

Returns a Transform stream. Pipe audio data into this, and it will output the
original data that was passed to the encoder.

This takes the same `opts` object as the encoder. For proper results, use the
same options as your encoder.


## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install binary-fsk
```

## See Also

- [goertzel](https://github.com/noffle/goertzel)
- [mic-stream](https://github.com/noffle/mic-stream)
- [audio-speaker](https://github.com/audio-lab/audio-speaker)

## License

ISC

