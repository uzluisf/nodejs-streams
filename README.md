# Overview of Node.JS Streams Interface


# Overview

If you've used Unix pipes, then you've used streams albeit unknowingly.
```bash
$ cat file.raku | wc -l
```
You can think of Node streams like Unix pipes that, instead of filtering data through command line programs, filter data through functions. For example, assuming we've a file `countLines.js` with the following contents:

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

running

```
$ cat file.raku | node countLines.js
```


Both `process.stdin` and `process.stdout` return a stream connected to the standard output and input respectively, specifically Readable (or Duplex) and Writable (or Duplex) streams. 

Don't worry if you don't understand `wtf.pipe(wtf)` yet. By the end of this document, you will be familiar enough with streams to explain what they are, why they are useful, when you should streams, understand code that uses streams, and even write your own stream-based code.



## Benefits

Streams are a first-class construct in Node.js for managing and modeling data. When it comes to streams, there are essentially three major concepts:

* **source** - where the data comes from.
* **pipeline** - where you filter or transform your data as it passes through.
* **sink** - where your data ultimately goes.
Among the benefits of using streams are the following:

* **Lazily produce or consume data in buffered chunks.** Data is dynamically processed when it's available, and then released when it's not longer needed.
* **Event-based and non-blocking**. NodeJS streams leverage both the `EventEmitter` API and non-blocking I/O libraries.
* **Low memory footprint.** You don't need to load up data all once into memory; instead you can process data dynamically processed chunk by chunk. This fact makes streams wonderfully efficient.
* **Automatically handle _**back-pressure**_.**
* **Buffers allow you to work around the v8 heap memory limit.**
* **Many Node's core modules implement streaming interfaces.** 

## Classes of streams

| Name | User methods | Description | Examples |
|:--------|:-----------------|:-----|:-------|
| stream.Readable | `_read(size)` | Used for I/O sources that generate data | ... |
| stream.Writable | `_write(chunk, encoding, callback)` | Used to write to an underlying output destination (or *sink*)| ... |
| stream.Duplex | `_read(size), _write(chunk, encoding, callback)` | A readable and writable stream | ... |
| stream.Transform | `_transform(chunk, encoding, callback)`, `_flush(size)` | A duplex streams that changes in some way, with no limitation on matching input data size with the output. | ... |
| streamn.PassThrough | | | ... |

Note there are only basic types of streams, i.e., Readable and Writable. A duplex stream is simply a composite of both Readable and Writable, and transform and passthrough streams are simply a type of duplex stream.

## When to use streams

Memory becomes an issue when working with large files. Even if you've enough memory, ideally you don't want a single application doing some I/O to use all of it.



## See also:

* [API](http://nodejs.org/docs/latest/api/stream.html)
* [Handbook](https://github.com/substack/stream-handbook)
* [Workshop](https://github.com/joyrexus/nodeschool/tree/master/stream-adventure#stream-adventure)
* [5 min guide](http://dailyjs.com/2013/04/01/streams-streams-streams/)


# Readable

Use a **Readable** stream if you want to wrap around an underlying I/O source with a streamable API.


## How to implement

1. Subclass [stream.Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable).

2. Implement a `_read(size)` method.


## Methods

### `_read(size)`

* `size` is in bytes, but can be ignored (especially for objectMode streams)
* `_read(size)` must call this.push(chunk) to send a chunk to the consumer


## Options

* `highWaterMark` number: maximum number of bytes to store in the internal
buffer before ceasing to read (default: 16kb)

* `encoding` string: if set, buffers will be decoded to strings instead of
passing buffers (default: `null`)

* `objectmode` boolean: instead of using buffers/strings, use javascript objects
(default: `false`)


## How to use

* `readable.pipe(target)`
* `readable.read(size)`
* `readable.on("data", ... )`


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


# Watching/Reading

* https://www.youtube.com/watch?v=QFwYiZfTFqA

* https://www.youtube.com/watch?v=2xftPPj_72g
	* 
