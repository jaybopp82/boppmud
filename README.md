# BoppMUD

BoppMUD is a NodeJS extension of the "simplemud" codebase.  This MUD engine
takes the very simple MUD program a bit further, by adding the below features
to the baseline simplemud program.  This code can be used for beginners or
intermediate coders looking for a simple MUD starting point, but want just
a few more features.

This MUD code base is in active development!  If there is a feature you'd
like to see, or are having issues with the current release, please reach out
to me and we'll talk.  Also, see the issues tab for any outstanding issues
and the Kanban board on the Projects tab for current and upcoming changes
to the application.

The original codebase for BoppMUD was written in C++ by Ron Penton, the
author of _MUD Game Programming_ book.

## Highlights

* Brand new auction system.
* Quest system with random targets.
* Online editing system! Edit rooms, enemies, even help files online!
* A quick mapping system.
* Areas, room flags, enemy flags.
* Many new commands: where, area, and more!
* In active development. More features coming soon.

## Requirements

* Node.js >= v6.4.0

## To Run Server

    $ git clone https://github.com/jaybopp82/boppmud.git
    $ cd boppmud
    $ npm install
    $ npm start <port>

## To Run Client

    $ telnet localhost <port>

## Special Thanks

Ron Penton for the original SimpleMUD C++ codebase.

Long Nguyen for the original SimpleMUD codebase.
