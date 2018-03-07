var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["mystery.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.altvalue = properties.altvalue;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	return {
		phoneNumber : faker.phone.phoneNumber(),
		format : faker.phone.phoneNumberFormat(),
		options : faker.phone.phoneFormats()
	}
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': [{},{'file':'content'}]
	},
	fileWithContent:
	{
		pathContent: 
		[	
  			{'file1': 'text content'},{'file1': ''}
		]
	}
};

function initalizeParams(constraints)
{
	var params = {};
	
	// initialize params
	for (var i =0; i < constraints.params.length; i++ )
	{
		var paramName = constraints.params[i];
		params[paramName] = '\'\'';
	}
	return params;	
}

function fillParams(constraints,params,property)
{
	// plug-in values for parameters
	for( var c = 0; c < constraints.length; c++ )
	{
		var constraint = constraints[c];
		if( params.hasOwnProperty( constraint.ident ) )
		{
			params[constraint.ident] = constraint[property];
		}
	}
}

function generateTestCases()
{

	var content = "var subject = require('./mystery.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{

		var params = initalizeParams(functionConstraints[funcName])
		var altparams = initalizeParams(functionConstraints[funcName])
		
		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });

		fillParams(constraints,params,"value")
		fillParams(constraints,altparams,"altvalue")
		
		//console.log("ALT",altparams)
		//console.log("P",params)

		// // Prepare function arguments.
		// var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		// var altargs = Object.keys(altparams).map( function(k) {return altparams[k]; }).join(",");

		if( pathExists || fileWithContent )
		{
			var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
			content += generateMockFsTestCases(funcName, args);
			// Bonus...generate constraint variations test cases....
			// content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args);
			// content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args);
			// content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);
		}
		else
		{
			var n = Math.pow(2,Object.keys(params).length);
			args_list = [];
			for (var j=0; j<n; j++) {
				args_list.push([]);
			}
			Object.keys(params).forEach(function(key) {
				var count=0;
				args_list.forEach(function(args) {
					if (count%n<n/2) {
						args.push(params[key]);
					} else {
						args.push(altparams[key]);
					}	
					count++;
				});
				n = n/2;
			});

			args_list = args_list.map(function(k) {return k.join(",");});
			
			args_list.forEach(function(args) {
				// Emit simple test case.
				content += "subject.{0}({1});\n".format(funcName, args );
			});
		}
	}


	fs.writeFileSync('test.js', content, "utf8");

}

function generateMockFsTestCases (funcName,args) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFSList = [{},{},{},{},{},{},{},{}];

	for (var attrname in mockFileLibrary.pathExists) 
	{ 
		mergedFSList[0][attrname] = mockFileLibrary.pathExists[attrname][0]; 
		mergedFSList[1][attrname] = mockFileLibrary.pathExists[attrname][0];
		mergedFSList[2][attrname] = mockFileLibrary.pathExists[attrname][1];
		mergedFSList[3][attrname] = mockFileLibrary.pathExists[attrname][1];
		mergedFSList[4][attrname] = mockFileLibrary.pathExists[attrname][0];
		mergedFSList[5][attrname] = mockFileLibrary.pathExists[attrname][1];
	}
	for (var attrname in mockFileLibrary.fileWithContent) 
	{ 
		mergedFSList[0][attrname] = mockFileLibrary.fileWithContent[attrname][0]; 
		mergedFSList[1][attrname] = mockFileLibrary.fileWithContent[attrname][1]; 
		mergedFSList[2][attrname] = mockFileLibrary.fileWithContent[attrname][0]; 
		mergedFSList[3][attrname] = mockFileLibrary.fileWithContent[attrname][1];
		mergedFSList[6][attrname] = mockFileLibrary.fileWithContent[attrname][0]; 
		mergedFSList[7][attrname] = mockFileLibrary.fileWithContent[attrname][1]; 
	}

	mergedFSList.forEach(function(mergedFS) {
		testCase += 
		"mock(" +
			JSON.stringify(mergedFS)
			+
		");\n";

		testCase += "\tsubject.{0}({1});\n".format(funcName, args );
		testCase+="mock.restore();\n";
	});
	
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			ph = fakeDemo();
			phAlt = fakeDemo();
			for( var p =0; p < params.length; p++ )
			{
				if( params[p] == 'phoneNumber' )
				{
					functionConstraints[funcName].constraints.push( 
					new Constraint(
					{
						ident: params[p],
						value:  "'"+ph.phoneNumber+"'",
						altvalue: "'"+phAlt.phoneNumber+"'",
						funcName: funcName,
						kind: "string",
						operator : '',
						expression: ''
					}));
				}

				if( params[p] == 'formatString' )
				{
					functionConstraints[funcName].constraints.push( 
					new Constraint(
					{
						ident: params[p],
						value:  "'"+ph.format+"'",
						altvalue: "'"+phAlt.format+"'",
						funcName: funcName,
						kind: "string",
						operator : '',
						expression: ''
					}));
				}
			}

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && (child.operator == "==" || child.operator == "!="))
				{
					if( child.left.type == 'Identifier' && child.left.name == "area")
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = parseInt(child.right.value);
						
						var ph = fakeDemo();
						
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: 'phoneNumber',
								// value: ph.phoneNumber.substring(0,1)+String(rightHand)+ph.phoneNumber.substring(4,ph.phoneNumber.length),
								// altvalue: ph.phoneNumber.substring(0,1)+String(rightHand+1)+ph.phoneNumber.substring(4,ph.phoneNumber.length),
								value: "'"+String(rightHand)+"-000-000"+"'",
								altvalue: "'"+String(rightHand+1)+"-000-000"+"'",
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == "<" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) - 1,
								altvalue: parseInt(rightHand) + 1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				// if( child.type === 'BinaryExpression' && (child.operator == "==" || child.operator == "!=" ))
				if( child.type === 'BinaryExpression' && (child.operator == "=="))
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						if(child.right.type == 'Identifier') {
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								altvalue: !rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
						} else {
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								altvalue: "[]",
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
						}
						
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == "<" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) - 1,
								altvalue: parseInt(rightHand) + 1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == ">" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) + 1,
								altvalue: parseInt(rightHand) - 1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "UnaryExpression" &&
					 child.operator == "!" &&
					 child.argument.type == "Identifier")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.argument.name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  false,
								altvalue: "{normalize:true}",
								funcName: funcName,
								kind: "boolean",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

			});

			console.log( functionConstraints[funcName]);
		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
exports.main = main;
