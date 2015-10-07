This document lists all network errors to test for, and whether/how they are handled for the various services.

TODO: List more here
TODO: Think about race conditions

TODO Game already started by another instance of bup/ticker software
	CourtSpot: Does switching sides work correctly?

Authentication failure
======================

Since badmintonticker employs a 302->200, we cannot detect login failures by the HTTP status code. Instead, look at the page content. This must be done for every request (TODO).

CourtSpot doesn't require authentication because it runs in the LAN.

No connection at all
====================

If there is no network from the start of the game on, we'll have to switch to manual either way. It works as far as bup is concerned.