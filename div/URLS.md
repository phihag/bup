Depending on the initial URL (the hash part of it), bup runs in different modes. An option foo can be enabled by navigating to https://.../bup/#foo. Here are the available options:

Ticker(backend) setup
=====================

demo      A one-match demo (will start right in the match)
bldemo    Demo of a Bundesliga match
bldemo_inprogress Demo of a Bundesliga match already running
bldemo_incomplete Demo of a Bundesliga match where not all players have been configured yet
edemo     Demo of an event (empty)
vdemo     Demo of an event (in progress)
btde      Run under badmintonticker
courtspot Run under CourtSpot
csde      Run under courtspot.de
btsh      Badminton tournament server (HTTP protocol)
tdemo     Tournament demo
nrwdemo   Demo of a match in the lower divisions in NRW
rlmdemo   German Regionalliga Nord Demo
nlademo   Demo of Swiss National League
jticker   Run under meyerjo/ticker (shuttlecock-live)

Initial UI
==========

These can be combined with any other options (but not each other), as in #bldemo&display .

settings       Show settings UI
display        Start in display mode
eventsheet=foo Show the dialog for generating the eventsheet named foo
order          Show the match order dialog
mo             Start with the manual order dialog (allows easy match creation and import)

Settings
========

lang=LANGCODE       Set language to the specified one. LANGCODE can be either de or en at the moment.
court=COURTCODE     Run on the specified court. COURTCODE depends on the network. Normally, a number like 1, 2, or the string "referee".
dm_style=STYLECODE  In display mode, start with the specified style.