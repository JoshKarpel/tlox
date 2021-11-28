import { Interpreter } from "./interpreter"
import { run } from "./run"

describe("integration", () => {
  const cases: Array<[string, string]> = [
    ["print 1;", "1\n"],
    ['if (true) print "foo"; else print "bar";', "foo\n"],
    ['if (false) print "foo"; else print "bar";', "bar\n"],
    [
      `
      var a = 1;
      var b = "foo";
      print a;
      print b;
      {
        var a = 2;
        b = b + "bar";
        print a;
        print b;
      }
      a = a + 2;
      b = b + "baz";
      print a;
      print b;
      `,
      "1\nfoo\n2\nfoobar\n3\nfoobarbaz\n",
    ],
    ["print 1 or 2;", "1\n"],
    ["print false or 2;", "2\n"],
    ["print false or false;", "false\n"],
    ["print nil or false;", "false\n"],
    ["print true or false;", "true\n"],
    ["print false and 1;", "false\n"],
    ["print 1 and false;", "false\n"],
    ["print 1 and 2;", "2\n"],
    [
      // first 20 Fibonacci numbers
      `
      var a = 0;
      var temp;

      for (var b = 1; a < 10000; b = temp + b) {
        print a;
        temp = a;
        a = b;
      }
      `,
      "0\n1\n1\n2\n3\n5\n8\n13\n21\n34\n55\n89\n144\n233\n377\n610\n987\n1597\n2584\n4181\n6765\n",
    ],
  ]
  for (const [source, output] of cases) {
    test(`Running ${source}\noutputs\n${JSON.stringify(output)}`, () => {
      let stdout = ""
      const interpreter = new Interpreter((chunk: string) => {
        stdout += chunk
      })

      run(interpreter, source)

      expect(JSON.stringify(stdout.toString().replace(/_/g, ""))).toStrictEqual(
        JSON.stringify(output),
      )
    })
  }
})
