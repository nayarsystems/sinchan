# sinchan

[![Build Status](https://travis-ci.org/nayarsystems/sinchan.svg?branch=master)](https://travis-ci.org/nayarsystems/sinchan) [![Coverage Status](https://coveralls.io/repos/github/nayarsystems/sinchan/badge.svg?branch=master&service=github)](https://coveralls.io/github/nayarsystems/sinchan?branch=master)

Go channels on Javascript

## Install

`npm install sinchan`

or

`yarn add sinchan`

## Unbuffered channel

Use `new sinchan.Channel()` to create an unbuffered channel.

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel();

ch.read().then(val => {
  console.log(val); // Prints "Hi!"
});

ch.write("Hi!");
```

`Channel.write` returns a promise that is resolved when the written value has been read from the unbuffered channel.

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel();

ch.write("Hi!").then(() => {
  console.log("write resolved"); // Will be printed after 3 seconds
});

setTimeout(() => {
  ch.read().then(val => {
    console.log("read: ", val);
  });
}, 3000);
```

## Buffered channel

Use `new sinchan.Channel(buffersize)` to create a buffered channel.

On a buffered channel writes will be resolved when they enter the buffer. If it is full they will wait to be resolved until someone reads and the write can enter the buffer.

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel(1); // Buffered channel: buffer size 1

ch.write("This is write 1").then(() => {
  console.log("write 1 resolved"); // Will be printed immediately
});

ch.write("This is write 2").then(() => {
  console.log("write 2 resolved"); // Will be printed after 3 seconds
});

setTimeout(() => {
  for (i = 0; i < 2; i++) {
    ch.read().then(val => {
      console.log("read: ", val);
    });
  }
}, 3000);
```

## Closed channels

If you try to write on an closed channel the call will throw an error.

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel();
ch.close();

ch.write("Hi!").catch(e => {
  console.log(e);
});
```

When closing a buffered channel you can read the values that remain on the buffer but any following reads will return null. Also all writes that where waiting to enter the buffer will be rejected.

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel(1);

ch.write("This is write 1")
  .then(() => {
    console.log("write 1 resolved");
  })
  .catch(e => {
    console.log("write 1 error:", e);
  });

ch.write("This is write 2")
  .then(() => {
    console.log("write 2 resolved");
  })
  .catch(e => {
    console.log("write 2 error:", e);
  });

setTimeout(() => {
  ch.close();
  ch.read()
    .then(val => {
      console.log("read 1: ", val);
    })
    .catch(e => {
      console.log("read 1 error: ", e);
    });

  ch.read()
    .then(val => {
      console.log("read 2: ", val);
    })
    .catch(e => {
      console.log("read 2 error: ", e);
    });
}, 3000);
```

Will print

```
write 1 resolved
<3 seconds wait...>
read 1:  This is write 1
read 2:  null
write 2 error: Error: Closed channel
```

You can check if a channel is closed with `Channel.isClosed()`

```javascript
var sinchan = require("sinchan");

var ch = new sinchan.Channel();

ch.close();
console.log(ch.isClosed()); // Will print: true
```
