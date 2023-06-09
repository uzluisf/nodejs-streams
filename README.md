
# Overview of Node.JS Streams Interface


# Motivation

I decided to write this document (yes, we're academics over here!) because for the longest time, I had been unable to make sense of streams in NodeJS, what they are, why they are useful, and how to leverage their power and awesomeness. I've read countless of articles/blogs and watched many Youtube videos but they were either beyond my understanding or too simplistic to be useful.

My intention here is to document what I've learned about streams and hopefully also help anyone in the same shoes I was in, i.e., someone who's used a few programming languages but never worked with streaming data per se. 

If you're familiar with some programming language, especially, then you shouldn't have any issue.

This document is based on a [joyrexus's gist](https://gist.github.com/joyrexus/10026630) [[archive](https://archive.is/i3aAS)], which in turn is based on [@brycebaril's](https://github.com/brycebaril) presentation, [Node.js Streams2 Demystified](http://brycebaril.github.io/streams2-presentation).

# Overview

If you've used Unix pipes, then you've used streams albeit unknowingly.

```bash
$ cat file.raku | wc -l
```

You can think of Node streams like Unix pipes that, instead of filtering data through command line programs, filter data through functions. Why? Well, because Unix pipes also streams.

For example, we could easily implement the functionality of the command `wc -l` using streams in a file named `countLines.js`:

```javascript
const stream = require("stream");

class LineCounter extends stream.Transform {
	constructor() {
      super();
      
    }
    
    _transform() {
       
    }
}

process.stdin.pipe(countLines).pipe(process.stdout)
```

and then pipe `file.raku` into 

```
$ cat file.raku | node countLines.js
```

At this point, I don't expect you to understand any of the code. I do expect you to get a feel of what's happening here: data being *streamed* from one place to another. Don't worry if you don't understand `wtf.pipe(wtf)` yet. By the end of this document, you will be familiar enough with streams in NodeJS to explain what they are, why they are useful, when you should use streams, understand code that uses streams, and even write your own stream-based code.

# What are streams?

The concept of a **stream** is a simple one: a stream is a sequence of data made available over time that may or may not be finite, much like a [*stream*](https://en.wikipedia.org/wiki/Stream). *Phew*, thankfully computer scientists and programmers are good at naming things.

**TODO: Insert image of a river here.**

When you're watching a Youtube video, you are (well your computer is) are dealing with a stream: pieces of the video are streaming over a network from Youtube's servers to your computer, i.e., the client, over time.

Streams aren't a new thing in the world of computing science, they've been used to solve problems similar to streams in NodeJS. For example, in the C programming language the standard way to represent a file is by using a stream. Similarly, when a C program starts, it has access to the standard I/O streams, i.e., an input stream, an output stream, and an error stream. Most languages have access to the standard streams in one form or another, and NodeJS isn't the exception. In fact, in the **Overview** section, `process.stdin` and `process.stdout` are the **st**andar**d** **in**put and **st**andar**d** **out**put streams respectively.

In NodeJS, streams are a first-class construct for managing and modeling data. If you're an observant you might've realized there have been three recurring themes in the last few paragraphs in regard to streams:

* A place where the data comes from; we call it the **source**. This is also referred as **upstream** (*up-stream*, get it?!)
* A place where the data ends up at; we call it the **sink**. This is also referred as **downstream**.
* A mechanism to get data from **source** to **sink**; we call it the **pipeline**.

**TODO: Add an image of a pipeline with data moving from source to sink.**

# Why are streams useful?

Among some of the benefits of streams are:

* **Lazily produce or consume data in buffered chunks.** Data is dynamically processed when it's available, and then released when it's not longer needed.
* **Event-based and non-blocking**. NodeJS streams leverage both the `EventEmitter` API and non-blocking I/O libraries. While your program is running, your stream-based code can respond to different events and it doesn't block the main thread of execution for the whole program.
* **Low memory footprint.** You don't need to load up data all once into memory; instead you can process data as it's produced. This ties up directly with the lazily evaluated nature of stream, which makes wonderfully space efficient.
* **Automatically handle _**back-pressure**_.** When moving data from a source to a sink, it might happen 
* **Buffers allow you to work around the V8 heap memory limit.** In order to prevent memory-leaking application from using all system memory, [the V8 engine has a hard limit on its heap size](https://v8.dev/blog/heap-size-limit) of 4GB, thus loading a file bigger than 4GB into memory won't work. Streams allow you to load the file chunk by chunk, and process them accordingly, without exceeding that limit.
* **Many Node's core modules implement streaming interfaces.** Many modules in the NodeJS's module ecosystem, including core ones, are implemented using streams so whether or not you're aware of them, you're already using streams. Knowing about them, even if you don't ever implement your own streams, is a net positive. 

## Classes of streams

The Streams API is composed of a few base classes, each of them with a particular use case. Each base class emits various events, which depend on whether the base class is readable, writable or both. The fact that streams inherit frm `EventEmitter` API means you can *subscribe* to various standard events to manage streams, or create your own custom events to represent more domain-specific behavior. If you're not familiar with the `EventEmitter` API, you're encouraged to read this [document](./event-emitter.md).

The following summarizes each of these base classes:

| Name | User methods | Description | Examples |
|:--------|:-----------------|:-----|:-------|
| Readable | `_read(size)` | Used for I/O sources that generate data | ... |
| Writable | `_write(chunk, encoding, callback)` | Used to write to an underlying output destination (or *sink*)| ... |
| Duplex | `_read(size), _write(chunk, encoding, callback)` | A readable and writable stream | ... |
| Transform | `_transform(chunk, encoding, callback)`, `_flush(size)` | A duplex streams that changes in some way, with no limitation on matching input data size with the output. | ... |
| PassThrough | | | ... |

Keep in mind there are only basic types of streams, i.e., Readable and Writable. A duplex stream is simply a composite of both Readable and Writable, and transform and passthrough streams are simply a type of duplex stream.

The following sections will dive deep into each base class by explaining its use case, how to utilize stream-based modules, and how to implement your own custom streams. 

A few words about conventions:

* **TODO: Write about conventions**
* When showing output, I use `...` to denote the remaining output. 

# Readable Streams

You should Use a **Readable** stream if you want to wrap around an underlying I/O source with a streamable API.


## How to implement

```javascript
const { Readable } = requre("stream");

class MyReadableSubclass extends Readable {
   constructor(options) {
     super(options);
   }
   
  _read(size) {
    // implementation goes here!
  }
}
```

As you can see,  in order to implement a custom Readable stream the subclass inherits from the `Readable` class, and implements the `constructor` and `_read(size)` 

###  `constructor`

The constructor of the `Readable` class has an `option` object argument with the following properties/keys:

* `highWaterMark`, a positive integer that indicates the maximum number of bytes to store in the internal
buffer before ceasing to read. Default: 16KB, i.e., `16 * 1024 bytes`.

* `encoding`,  a string to indicate the buffers should be decoded to strings instead of passing the buffer as is. Default: `null`. 

* `objectmode`, a boolean that indicates, when `true`, that javascript objects should be used instead of using buffers/strings. Default: `false`.

### `_read(size)`

* `size` is in bytes, but can be ignored (especially for objectMode streams)
* `_read(size)` must call this.push(chunk) to send a chunk to the consumer

## How to use

* `readable.on("data", data => { ... })`
* `readable.pipe(writable)`
* `readable.read(size)`

## Reading data from a file using a Readable stream

```javascript
// read-file-stream.js
const fs = require("fs");

const filename = "data/agatha.txt";
const readable = fs.createReadStream(filename, {
  highWaterMark: ,
});

readable.on('data', (data) => {
   console.log(data);
   console.log('-'.repeat(80));
});
```

At the moment of writing this, the `Readable` class can emit seven events: `close`, `data`, `end`, `error`, `pause`, `readable`, and `resume`. You're encouraged to [read the documentation](https://nodejs.org/api/stream.html#class-streamreadable) for each of them.

Running `read-file-stream.js` gets us the following output:
```

```


## See also

* [stream-spigot](http://npm.im/stream-spigot) - creates readable streams from Arrays or simple functions


---


# Writable

Use a **Writable** stream when you want to get output from a program to use elsewhere, or send data elsewhere within a program. 

Think: drain/collect.


## How to implement

1. Subclass [stream.Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable).

2. Implement a `_write(chunk, encoding, callback)` method.


## Methods

### `_write(chunk, encoding, callback)` 

* `chunk` is the content to write
* Call `callback()` when you're done with this chunk


## Options

* `highWaterMark` number: maximum number of bytes to store in the internal
buffer before ceasing to read (default: 16kb)

* `decodeStrings` boolean: whether to decode strings to Buffers before passing
them to `_write()` (default: true)


## How to use

* `source.pipe(sink)`
* `writable.write(chunk [,encoding] [,callback])`


## See also

* [concat-stream](http://npm.im/concat-stream) - writable stream that
  concatenates strings or binary data and calls a callback with the result


---


# Transform

Use a **Transform** stream when you want to change the data in some way by parsing it.

Think: filter/map.


## How to implement

1. Subclass [stream.Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform).
2. Implement a `_transform(chunk, encoding, callback)` method.
3. Optionally implement a `_flush(callback)` method.


## Methods

### `_transform(chunk, encoding, callback)`

Call `this.push(something)` to forward it to the next consumer.
You don't have to push anything, this will skip a chunk.
You *must* call `callback` one time per `_transform` call.

### `_flush(callback)`

When the stream ends, this is your chance to do any cleanup or last-minute `this.push()` calls to clear any buffers or work. Call `callback()` when done.


## Options

Superset of Readable and Writable options.


## How to use

* `source.pipe(transform).pipe(drain)`
* `transform.on("data", ... )`


## See also

* [through2](http://npm.im/through2) - makes it easy to generate Transforms without all the subclassing boilerplate
* [through2-map](https://github.com/brycebaril/through2-map) - 
  Array.prototype.map analog for streams
* [through2-filter](https://github.com/brycebaril/through2-filter) - 
  Array.prototype.filter analog for streams
* [through2-reduce](https://github.com/brycebaril/through2-reduce) - 
  Array.prototype.reduce analog for streams
* [stream reducer demo](http://bl.ocks.org/joyrexus/9074340) - showing how
  to extend a Transform stream to create reducers/accumulators for streamed objects
* [sculpt](https://github.com/Medium/sculpt) - a collection of transform stream
  utilities (all operating in `objectMode`)
* [pipe-iterators](https://github.com/mixu/pipe-iterators) - another collection
  of functions for iterating over object mode streams

# Duplex

Use a **Duplex** stream when you want to use a data source that can also receive messages.

# PassThrough

Use a **PassThrough** stream when you want to extract data from streams without changing it, from testing to analysis.

# Reference



* Forked from https://gist.github.com/joyrexus/10026630 (https://archive.is/i3aAS), which in turn is based on [@brycebaril's](https://github.com/brycebaril) presentation, [Node.js Streams2 Demystified](http://brycebaril.github.io/streams2-presentation).
* Young & Harter's *NodeJS in Practice*.
* [Daddy, what's a stream](https://github.com/creationix/howtonode.org/blob/master/articles/streams-explained.markdown) ([Archive](https://archive.is/KZabP))
* https://jayconrod.com/posts/55/a-tour-of-v8-garbage-collection
* https://v8.dev/blog/heap-size-limit
* [API](http://nodejs.org/docs/latest/api/stream.html)
* [Handbook](https://github.com/substack/stream-handbook)
* [Workshop](https://github.com/joyrexus/nodeschool/tree/master/stream-adventure#stream-adventure)
* [5 min guide](http://dailyjs.com/2013/04/01/streams-streams-streams/)

# Watching/Reading

* https://www.youtube.com/watch?v=QFwYiZfTFqA

* https://www.youtube.com/watch?v=2xftPPj_72g
	* 
