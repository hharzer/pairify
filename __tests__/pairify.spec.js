const assert = require('assert');
const fs = require('fs');

const sb = require('../src/pairify');
const readFile = file =>
	fs.readFileSync(__dirname + '/samples/' + file).toString('utf8');

describe('Given the pairify library', () => {
	describe('when we pass code', () => {
		it('should properly analyze it', () => {
			const res = sb.analyze('foo bar { a b c } foo() bar');
			expect(res).toStrictEqual([
				{
					"type": "curly",
					"from": [1, 9],
					"to": [1, 18]
				},
				{
					"type": "round",
					"from": [1, 22],
					"to": [1, 24]
				}
			])
		})
	});
	describe('when we pass nested pairs', () => {
		it('should properly analyze it', () => {
			const res = sb.analyze('foo bar({ test: 20 }) moo');
			expect(res).toStrictEqual([
				{ type: 'curly', from: [ 1, 9 ], to: [ 1, 21 ] },
				{ type: 'round', from: [ 1, 8 ], to: [ 1, 22 ] }
			])
		});
		it('should properly analyze it even with complex nesting', () => {
			const res = sb.analyze('foo bar({ test: \'Hey, "John"\', "a": `b` }, { n: 20 }) moo');
			expect(res).toStrictEqual([
        { type: 'double-quotes', from: [ 1, 23 ], to: [ 1, 29 ] },
        { type: 'single-quotes', from: [ 1, 17 ], to: [ 1, 30 ] },
        { type: 'double-quotes', from: [ 1, 32 ], to: [ 1, 35 ] },
        { type: 'template-literal', from: [ 1, 37 ], to: [ 1, 40 ] },
        { type: 'curly', from: [ 1, 9 ], to: [ 1, 42 ] },
        { type: 'curly', from: [ 1, 44 ], to: [ 1, 53 ] },
        { type: 'round', from: [ 1, 8 ], to: [ 1, 54 ] }
      ])
		});
		it('should properly analyze it even with complex nesting', () => {
			const res = sb.analyze('function go(a = " ) ") { }');
			expect(res).toStrictEqual([
        { type: 'double-quotes', from: [ 1, 17 ], to: [ 1, 22 ] },
        { type: 'round', from: [ 1, 12 ], to: [ 1, 23 ] },
        { type: 'curly', from: [ 1, 24 ], to: [ 1, 27 ] }
      ])
		})
	});
	describe('when there are unbalanced pairs', () => {
		it('should still provide some analysis', () => {
			const res = sb.analyze('const v = { prop: "value - test \'foo\') }');
			expect(res).toStrictEqual([
				{ type: 'single-quotes', from: [ 1, 33 ], to: [ 1, 38 ] }
			])
		});
	});
	describe('when we have a multi-line code', () => {
		it('should properly calculate the line position', () => {
			const res = sb.analyze(`import { 
	a
} from 'b';
function test() {
  return "foobar";
}`);
			expect(res).toStrictEqual([
        { type: 'curly', from: [ 1, 8 ], to: [ 3, 2 ] },
        { type: 'single-quotes', from: [ 3, 8 ], to: [ 3, 11 ] },
        { type: 'round', from: [ 4, 14 ], to: [ 4, 16 ] },
        { type: 'double-quotes', from: [ 5, 10 ], to: [ 5, 18 ] },
        { type: 'curly', from: [ 4, 17 ], to: [ 6, 2 ] }
      ])
		});
	});
	describe('when we tokens in a string', () => {
		it('should search backwards to the top of the stack', () => {
			const res = sb.analyze(`function message() {
  return "'{test}foobar(test)}"; // this is a return statement
  // a comment
}`);
			expect(res).toStrictEqual([
        { type: 'round', from: [ 1, 17 ], to: [ 1, 19 ] },
        { type: 'curly', from: [ 2, 12 ], to: [ 2, 18 ] },
        { type: 'round', from: [ 2, 24 ], to: [ 2, 30 ] },
        { type: 'double-quotes', from: [ 2, 10 ], to: [ 2, 32 ] },
        { type: 'comment-single-line', from: [ 2, 34 ], to: [ 2, 63 ] },
        { type: 'comment-single-line', from: [ 3, 3 ], to: [ 3, 15 ] },
        { type: 'curly', from: [ 1, 20 ], to: [ 4, 2 ] }
      ])
		});
	});
	describe('when checking more complex examples', () => {
		it.each([
			['code', 'code.json'],
			['code-simple', 'code-simple.json']
		])('should work properly (%s)', (a, b) => {
			const sourceCode = readFile(a);
			const analysis = readFile(b);
			const result = sb.analyze(sourceCode);
			fs.writeFileSync(
				`${__dirname}/samples/result-${a}.json`,
				`[\n${result.map(o => `  ${JSON.stringify(o)}`).join(',\n')}\n]`
			);
			expect(sb.analyze(sourceCode)).toStrictEqual(JSON.parse(analysis));
		})
	});
});