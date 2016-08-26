event
=====

matches*        A list of matches to be played (see below)
preferred_order Array of eventsheet_id (recommended) or match_name values that indicate the best order of matches as set by the tournament organizers.
                Example: ["MS1", "WS", "MS2", "MD1", "WD", "MD2", "MX"].
league_key      ID of the league being played (this determines which event sheets are available, among others).
                Strongly recommended if applicable.
                Available values: "1bl-2015", "2bln-2015", "2bls-2015", "1bl-2016", "2bln-2016", "2bls-2016", "RLW", "RLN"
team_names      Array of home and away team name. Required for team competitions.
                Example: ["TV Refrath", "BC Bischmisheim"]
id              Globally unique event id, e.g. "2016-bundesliga-refrath vs bischmisheim"
location        Location name and address as a string, e.g. "SpH Steinbreche"
protest         Text describing the protest of one team, e.g. "Court extremely slippery (Home team, 19:00)"
umpires         String describing umpires (for eventsheet), e.g. "Barbara Bub & Klaus-Michael Becker"
starttime       Human-readable official start time, e.g. "19:00"
matchday        Match day according to league plan, e.g. "1" (first game of the season) or "semi-finals"
notes           Non-protest notes, e.g. "Bundesliga logo missing on front of information sheet"
backup_players  2-element list (home/away), each element is another list of all the players (see below).
                gender key required for each player.
all_players     2-element list (home/away), each element is a list of all players that can play for the team.
                gender key required for each player.
teamsters       2-element list (home/away). Name (as string) of the teamsters of each team.
                Depending on regulation, not necessarily (active) players.
                Example: [["Heinz Kelzenberg", "Michael Fuchs"]]


match
=====

setup*        All properties that don't change during the match
presses       Array of press, contains all button presses in the match so far.
presses_json  JSON encoding of presses (in order to not construct a large number of objects)
network_score The score displayed in the network system (may be different to actual score in case of retiring or disqualification).
              A list of 2-element lists, e.g. [[21, 19], [29, 30], [15, 4]]. First element is home team, second away team.
incomplete    Boolean. If set than the match is not yet ready to be called,
              for instance because no players have been assigned yet.

press
=====

timestamp*       UNIX timestamp when the button was pressed.
type*            What kind of button has been pressed. Determines the other keys.
 "pick_side"     Who plays on which side.
   team1_left*   (true: home team left, false: home team right)
 "pick_server"   Who is serving.
     team_id*    0: home team, 1: away_team
     player_id*  Index in players array of setup.teams (0 in singles)
 "pick_receiver" Who is receiving (optional in singles).
     team_id*    0: home team, 1: away_team
     player_id*  Index in players array of setup.teams (0 in singles)
...

match setup
===========

eventsheet_id     Language-independent ID of the match describing match type and number, e.g. "MS1". If missing match_name will be used.
match_name*       Human-readable name of the match, e.g. "1. MS"
match_id*         (Globally) unique ID, e.g. "20160825-Bundesliga-finale-MS1"
teams*            An array (0: home team, 1: away team) of teams (see below).
is_doubles*       Boolean key. false => singles, true => mixed/doubles
counting*         Scoring system. Valid values are "3x21", "1x21", "2x21+11", "5x11_15", "1x11_15", "5x11/3"
team_competition* Are players competing for their teams(true) or for themselves(false)? Affects announcements
event_name        Name of the event (will be present on scoresheet), e.g. "Finals"
tournament_name   Name of the overall tournament (will be present on scoresheet), e.g. "Bundesliga 2015/2016"

team
====

name     The team, club, or country name the player is competing for, e.g. "TV Refrath". Required when team_competition is set in match setup.
players* Array of players (1 in singles, 2 in doubles/mixed). Each element of that array is a player object (see below).

player
======

firstname Given name. If present lastname must be present as well.
gender    "m" or "f". If missing this is guessed by eventutils.guess_gender.
lastname  Surname. If present firstname must be set as well.
name*     Full name of the player

* required