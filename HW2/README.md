[![Build Status](https://travis-ci.org/CSC-DevOps/TestGeneration.svg?branch=master)](https://travis-ci.org/CSC-DevOps/TestGeneration)

## Test Generation

The goal of this work shop is to learn use a combination of mocking, random testing, and feedback-directed testing to automatically increase testing coverage. This is a powerful technique that can automatically discover bugs in new commits deployed to a build server before hitting production or affecting canary servers.

## Setup and Background

    git clone https://github.com/CSC-DevOps/TestGeneration.git
    cd TestGeneration
    npm install

### Code Coverage

Code coverage can be an effective way to measure how well tested a code system is. To see code coverage in action, we will run `istanbul` on our "test suite", represented by 'test.js'.

##### Getting a simple coverage report

[Useful resource](http://ariya.ofilabs.com/2012/12/javascript-code-coverage-with-istanbul.html) for istanbul.

You can run the local version as follows:

    node_modules/.bin/istanbul cover test.js
    node_modules\.bin\istanbul cover test.js (Windows)

To install istanbul globally, saving some keystrokes, you can do the following:

    npm install istanbul -G

You'll get a high level report as follows (a more detailed report will be stored in `coverage/`):

```
=============================== Coverage summary ===============================

Statements   : 80% ( 4/5 )
Branches     : 50% ( 1/2 )
Functions    : 100% ( 1/1 )
Lines        : 100% ( 4/4 )
================================================================================
```

##### See a fully annotated html report here:
    
    open coverage/lcov-report/TestGeneration/subject.js.html
    start coverage/lcov-report/TestGeneration/subject.js.html (Windows)

### Mocking

Testing file system code in unit tests can be challenging. One helpful tool is to use mocking.

The [mock-fs framework](https://github.com/tschaub/mock-fs) can be used to generate a fake file system to help improve coverage.

For example, this is a fake filesystem you can create:

```javascript
mock({
  'path/to/fake/dir': {
    'some-file.txt': 'file content here',
    'empty-dir': {/** empty directory */}
  },
  'path/to/some.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
  'some/other/path': {/** another empty directory */}
});
```

For example, the following is automatically generated to create to test the function, `fileTest`.

```javascript
mock({"path/fileExists":{},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
```

### Random Testing based on Constraints

#### Constraint discovery

One of our functions, `inc(p,q)` is as follows:

```javascript
function inc(p, q){
   if(q ==undefined) q =1;
   if( p < 0 )
   {
   	p = -p;
   }
   return p + q/q;
}
```

Based on a code analysis of conditions inside if statements, we can infer a couple of facts about the program.

* q may possiblity be undefined.
* p can have a value that is less than 0.

We may further deduce more facts:

* By executing the converse of the `p < 0` (that is, `p >= 0`) will cause a different branch to be executed.

Based on our previous work shop on static analysis, we already know the basics about how to analyze a code system and extract condition statements.

#### Using contraints for test generation

Altogether, these facts gives us ideas about what we can use in test generation. We could just use pure random generation, but it would be much more difficult to guarantee that we could execute the program in more depth. Instead, the facts give us concrete test case values we can use:

    inc(-1,undefined)
    inc(0,undefined)

## Workshop

For the workshop, we will extend the code in order to discover more facts/constraints about input to a function and use that to generate test cases.

Note that running `node main.js` will generate some test cases already. But now want to improve our coverage.

Directory Contents:

* **main.js**: Main code driving constraint discovering and test case generation.
* **subject.js**: This is the code we are testing. It contains some simple code with operations on strings, integers, files, and phone numbers.
* **test.js**: This is an automatically created test script. Running `node main.js` will create a new `test.js`.

### Improving constraint discovery.

Right now, the discovery engine looks for expressions, such as `q == undefined`, and are used to help generate test cases, such as:

    subject.inc('',undefined);

But notice that p has no concrete value associated with it, instead if just has a default value of `''`.

* 1) Extend the constraint discovery to handle expressions, such as '<' and '>'.
* 2) Extend code to better handle string types, especially with operations such as != "string".

### Improving mocking

We can use the observation that if a parameter variable (e.g., file) is used to call a filesystem call such as `file.readFile()`, then it probably is a file. We can then create test cases that will simulate different file system states.

* 1) Extend the mock system to handle creating empty directories and directories with content, but checking when a function parameter is every used in a "readdirSync" call.
* 2) Extend the test case generation to be handle more code relying on file systems: Hint, there is a simple change you can make under:
"// Bonus...generate constraint variations test cases...."

### Other ways to improve coverage

Use clues in the code to automate the process of including file system, phone number mocking without manual injection.

* Negate constraints to help discovery.
* Handle string operations such as "indexOf".
* Handle existance of object properties such as "normalize".
* Use the `faker` framework to generate a fake phone number to help improve coverage.

[faker.js docs](https://github.com/Marak/faker.js), [mock-fs docs](https://www.npmjs.com/package/mock-fs)


## Other Resources

There are other tools that can help you generate random tests for other languages such as Java.

### Test Generation in Java

Download randoop:

    wget https://randoop.googlecode.com/files/randoop.1.3.4.jar

Sample execution to generate tests for all classes in the java.util.Collections namespace (Need Java 7):

    java -classpath randoop.1.3.4.jar randoop.main.Main gentests --testclass=java.util.TreeSet --testclass=java.util.Collections --timelimit=60

This will create a file `RandoopTest.java`, which contains a test driver, and `RandoopTest0.java`, which contains the generated unit tests.

### Coverage in Java

[Emma](http://emma.sourceforge.net/intro.html) is a decent option to collect coverage information form a java program.


## Errors

> make: Entering directory `/home/vagrant/TestGeneration/node_modules/random-js/node_modules/microtime/build'
  CXX(target) Release/obj.target/microtime/src/microtime.o
make: g++: Command not found
make: *** [Release/obj.target/microtime/src/microtime.o] Error 127

Fix with installing g++ on your system, such as `apt-get install g++`
