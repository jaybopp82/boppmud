# BoppMUD

As its name implies, BoppMUD is a NodeJS implementation of a rudimentary
MUD server. It is intended to be used as a learning experience for those who
has never programmed a MUD server before.

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

Shawn Biddle for [RanvierMUD](http://ranviermud.com), which is a source of
inspirations.

Raymond Xie for the [WebTelnet](https://github.com/mudchina/webtelnet) that is
used as the Demo.

Long Nguyen for the original SimpleMUD codebase.
