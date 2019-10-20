Badminton Umpire Panel
=======

## Demos

- [Quick demo: Start a match](https://aufschlagwechsel.de/bup/#demo)
- [German Bundesliga](https://aufschlagwechsel.de/bup/#bldemo)
- [Austrian Bundesliga](https://aufschlagwechsel.de/bup/#obldemo)
- [NLA (Swiss national league)](https://aufschlagwechsel.de/bup/#nlademo)
- [German Regionalliga Nord](https://aufschlagwechsel.de/bup/#rlndemo)
- [German Regionalliga West](https://aufschlagwechsel.de/bup/#rlwdemo)
- [German Regionalliga Mitte](https://aufschlagwechsel.de/bup/#rlmdemo)
- [German Regionalliga SüdOst](https://aufschlagwechsel.de/bup/#rlsodemo)
- [International match](https://aufschlagwechsel.de/bup/#intdemo)
- [Tournament](https://aufschlagwechsel.de/bup/#tdemo)

## Documentation

The [(German only) handbook](https://aufschlagwechsel.de/bup/doc/) introduces the General setup, primarily for team matches.

You can [configure features by adding parameters into the URL](doc/URLs.txt). For example, [`#display&court=2&dm_style=onlyscore&d_c0=#ff0000&d_c1=#0000ff`](https://aufschlagwechsel.de/bup/#bldemo_inprogress&display&court=2&dm_style=onlyscore&d_c0=#ff0000&d_c1=#0000ff) will open a display showing only the score on court 2 with a red-blue color scheme.

The internal data structures are [documented in detail here](doc/data_structures.txt).

## Installation

For development, simply open `bup.html` in any web browser. That's it!

Type `make deps` to install all dependencies.

You can then run the tests with `make test`, and build a distribution file with `make dist`.

## Browser support

bup runs on all modern browsers, as well as Edge 12+, IE9+, Smart TVs, and Safari. In short: Any device sold in the last decade should work.

## Download

You can also download the current build as a zip file at [https://aufschlagwechsel.de/bup.zip](https://aufschlagwechsel.de/bup.zip) .

## Support & Questions

If you have any suggestions, questions, or bug reports, either [create an issue](https://github.com/phihag/bup/issues/new) or contact me at [phihag@phihag.de](mailto:phihag@phihag.de).
